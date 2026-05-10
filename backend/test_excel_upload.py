import pandas as pd
import os
import asyncio
import sqlite3
import sys

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.upload_service import upload_service

def create_sample_excel(filename, num_rows=10000):
    print(f"Creating sample Excel file: {filename} with {num_rows} rows...")
    df1 = pd.DataFrame({
        'ID': range(1, num_rows + 1),
        'Name': [f'User_{i}' for i in range(1, num_rows + 1)],
        'Value': [i * 1.5 for i in range(1, num_rows + 1)],
        'Date': pd.date_range(start='2023-01-01', periods=num_rows, freq='h')
    })
    
    df2 = pd.DataFrame({
        'CategoryID': range(1, 11),
        'CategoryName': [f'Category_{i}' for i in range(1, 11)]
    })
    
    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        df1.to_excel(writer, sheet_name='SalesData', index=False)
        df2.to_excel(writer, sheet_name='Categories', index=False)
    print("Sample Excel created.")

async def test_excel_processing():
    test_file = "test_large_data.xlsx"
    create_sample_excel(test_file, num_rows=12000) # > 10000 to test chunking
    
    try:
        print("Starting Excel processing...")
        db_path, table_names = await upload_service.process_excel_to_sqlite(
            excel_paths=[os.path.abspath(test_file)],
            original_names=[test_file]
        )
        
        print(f"Processed successfully. DB Path: {db_path}")
        print(f"Tables created: {table_names}")
        
        # Verify data in SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        for table in table_names:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"Table '{table}' has {count} rows.")
            
            cursor.execute(f"PRAGMA table_info({table})")
            cols = [col[1] for col in cursor.fetchall()]
            print(f"Columns in '{table}': {cols}")
            
        conn.close()
        
    except Exception as e:
        print(f"Error during test: {e}")
    finally:
        if os.path.exists(test_file):
            os.remove(test_file)
        # We don't remove the SQLite file so we can check it if needed, 
        # but in production cleanup is handled.

if __name__ == "__main__":
    asyncio.run(test_excel_processing())
