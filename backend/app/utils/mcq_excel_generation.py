import logging
import pandas as pd

logger = logging.getLogger(__name__)

async def mcq_report_excel_generation(mcq_data):
    try:
        df = pd.DataFrame(mcq_data)

        if not df.empty:
            candidate_name = df.loc[0, "candidate_name"]
            candidate_email = df.loc[0, "candidate_email"]
            interview_id = df.loc[0, "interview_id"]

            df.loc[1:, ["candidate_name", "candidate_email", "interview_id"]] = ""  

        
        # Calculate summary stats
        total_questions = df[df["question"].notnull()].shape[0]   # only rows with questions
        correct_answers = df[df["is_correct"] == True].shape[0]
        incorrect_answers = df[df["is_correct"] == False].shape[0]
        score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0

        # Create summary DataFrame
        summary_df = pd.DataFrame([{
            "Total Questions": total_questions,
            "Correct Answers": correct_answers,
            "Incorrect Answers": incorrect_answers,
            "Score Percentage": f"{score_percentage:.2f}%"
        }])

        # Append summary at the bottom of the original MCQ DataFrame
        df_combined = pd.concat([df, summary_df], ignore_index=True)

        # Save to Excel
        filename = f"MCQ_Report_{df.loc[0, "candidate_name"]}.xlsx"
        filepath = f"./{filename}"
        df_combined.to_excel(filepath, index=False, engine="openpyxl")
        logger.info("Successfully generated the excel file for mcq report")
        return df_combined.to_excel(filepath, index=False, engine="openpyxl")
    except Exception as e:
        logger.exception(f"An error in mcq_report_excel_generation: {str(e)}")

