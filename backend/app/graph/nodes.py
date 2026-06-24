from app.graph.state import GraphState
from app.services.llm_service import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import sqlite3
import pandas as pd
import json

llm = get_llm()

# Hard cap on rows returned to the client, regardless of the LIMIT the LLM emits.
MAX_RESULT_ROWS = 1000

# Write keywords blocked as defense-in-depth (the read-only connection is the real guard).
WRITE_KEYWORDS = ("DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "REPLACE", "TRUNCATE")


def _connect_readonly(db_path: str) -> sqlite3.Connection:
    """Open a SQLite connection in read-only mode.

    Using the immutable read-only URI enforces read-only access at the engine
    level, so writes (DROP/DELETE/UPDATE/etc.) fail no matter how the SQL is
    crafted — far more robust than scanning the query string for keywords.
    """
    return sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)


def format_history(history: Optional[List[dict]]) -> str:
    """Render prior turns so the model can resolve follow-up questions."""
    if not history:
        return "(no previous questions)"
    lines = []
    for turn in history:
        q = (turn.get("question") or "").strip()
        s = (turn.get("generatedSQL") or turn.get("sql") or "").strip()
        if not q:
            continue
        lines.append(f"- Q: {q}\n  SQL: {s}" if s else f"- Q: {q}")
    return "\n".join(lines) if lines else "(no previous questions)"


# --- Structured output schemas (replace fragile string parsing) ---

class RouteDecision(BaseModel):
    intent: Literal["data", "chat"] = Field(
        description='"data" for a tabular SQL answer, "chat" for a text summary/explanation.'
    )


class SQLQuery(BaseModel):
    sql: str = Field(description="A single, read-only SQLite SELECT query that answers the question.")


# --- Prompts ---
ROUTER_PROMPT = """You are analyzing intent for a database querying system.
Given the user's question, decide if they want:
1. "data" - A tabular response containing actual rows pulled via an SQL query (e.g. "show me the top 10 rows", "filter by x", "get all the ...").
2. "chat" - A text response, such as a general question, a "summary of the table", insights, an explanation, or conversational chat.

Conversation so far:
{history}

Question: {question}
"""

GENERATE_SQL_PROMPT = """You are a SQL expert. Generate a single, valid, read-only SQLite SELECT query that answers the question.

Schema (the "Sample values" lines show real distinct values per column — use them to pick correct literals, casing, and date formats in WHERE clauses):
{schema}

Conversation so far (use it to resolve follow-up questions like "now only 2023" relative to the previous query):
{history}

Question: {question}

Allowed columns (if this list is non-empty, the SELECT output must contain ONLY these columns — never use SELECT *): {restricted_columns}
Previous feedback (if present, fix exactly this problem): {feedback}

Unless the user specifies a limit, add a default LIMIT 1000 so there is enough data for visualization.
"""

CHAT_PROMPT = """You are a helpful Data Analysis Chatbot.
Based on the following database schema and a preview of the data:
Schema:
{schema}

Preview of first 5 rows:
{preview}

Conversation so far:
{history}

Answer the user's question or summarize the table as requested. Provide a concise, clear text response. Do NOT provide tabular data if they want a summary, just describe it or answer their text question.
Question: {question}
"""

# --- Nodes ---

async def route_intent_node(state: GraphState):
    prompt = ChatPromptTemplate.from_template(ROUTER_PROMPT)
    inputs = {"question": state["question"], "history": format_history(state.get("history"))}
    try:
        chain = prompt | llm.with_structured_output(RouteDecision)
        decision = await chain.ainvoke(inputs)
        intent = decision.intent
    except Exception:
        # Default to a data query if routing fails.
        intent = "data"

    return {"intent": intent}


async def chat_node(state: GraphState):
    db_path = state["db_path"]

    preview_data = {}
    if db_path:
        try:
            conn = _connect_readonly(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [r[0] for r in cursor.fetchall()]
            for t in tables:
                df = pd.read_sql_query(f'SELECT * FROM "{t}" LIMIT 5', conn)
                df = df.replace([float('inf'), float('-inf'), float('nan')], None)
                preview_data[t] = df.to_dict(orient="records")
            conn.close()
        except:
            pass

    prompt = ChatPromptTemplate.from_template(CHAT_PROMPT)
    chain = prompt | llm | StrOutputParser()
    response = await chain.ainvoke({
        "schema": state["schema"],
        "preview": json.dumps(preview_data, default=str),
        "history": format_history(state.get("history")),
        "question": state["question"]
    })

    return {"result": response, "valid": True, "intent": "chat"}


async def generate_sql_node(state: GraphState):
    prompt = ChatPromptTemplate.from_template(GENERATE_SQL_PROMPT)
    inputs = {
        "schema": state["schema"],
        "question": state["question"],
        "history": format_history(state.get("history")),
        "restricted_columns": state.get("restricted_columns") or [],
        "feedback": state.get("feedback") or ""
    }

    try:
        chain = prompt | llm.with_structured_output(SQLQuery)
        out = await chain.ainvoke(inputs)
        sql = (out.sql or "").strip()
    except Exception:
        # Fallback: plain text output with markdown fences stripped.
        chain = prompt | llm | StrOutputParser()
        response = await chain.ainvoke(inputs)
        sql = response.replace("```sql", "").replace("```", "").strip()

    return {"sql": sql, "iterations": state["iterations"] + 1}


async def validate_sql_node(state: GraphState):
    """Validate the SQL deterministically with SQLite's EXPLAIN.

    EXPLAIN compiles the statement without running it, so a hallucinated column
    or table raises a precise error (e.g. "no such column: revenu") that feeds
    straight back into the retry loop — far more reliable than asking the LLM.
    """
    sql = (state.get("sql") or "").strip()
    db_path = state.get("db_path")

    if not sql:
        return {"valid": False, "feedback": "No SQL was generated. Produce a single SELECT query."}

    # Block writes before they can compile (the keyword guard, not EXPLAIN, catches these).
    if any(kw in sql.upper() for kw in WRITE_KEYWORDS):
        return {"valid": False, "feedback": "Write operations are not allowed; generate a read-only SELECT."}

    if not db_path:
        return {"valid": False, "feedback": "Database path missing."}

    try:
        conn = _connect_readonly(db_path)
        try:
            conn.execute("EXPLAIN " + sql)
        finally:
            conn.close()
        return {"valid": True, "feedback": ""}
    except Exception as e:
        return {"valid": False, "feedback": f"SQL is invalid: {str(e)}"}


async def execute_sql_node(state: GraphState):
    db_path = state["db_path"]
    sql = state["sql"]

    if not db_path:
         return {"valid": False, "feedback": "Database path missing."}

    # Defense-in-depth: reject obvious write keywords before we even connect.
    if any(kw in sql.upper() for kw in WRITE_KEYWORDS):
         return {"valid": False, "feedback": "Write operations are not allowed."}

    try:
        # Read-only connection is the real guard: any write attempt raises here.
        conn = _connect_readonly(db_path)
        try:
            df = pd.read_sql_query(sql, conn)
        finally:
            conn.close()

        # Governance: when an allowlist is set, the output must only contain those columns.
        allowed = state.get("restricted_columns") or []
        if allowed:
            extra = [c for c in df.columns if c not in set(allowed)]
            if extra:
                return {
                    "valid": False,
                    "feedback": (
                        f"The result included columns that are not allowed: {extra}. "
                        f"Select ONLY these columns (do not use SELECT *): {allowed}."
                    ),
                }

        df = df.head(MAX_RESULT_ROWS)
        df = df.replace([float('inf'), float('-inf'), float('nan')], None)
        result = df.to_dict(orient="records")

        return {"result": result, "valid": True}
    except Exception as e:
        return {"valid": False, "feedback": f"Runtime Error: {str(e)}"}
