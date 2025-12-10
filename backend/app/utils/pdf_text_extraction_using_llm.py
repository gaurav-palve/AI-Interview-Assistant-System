from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

async def extract_data(pdf_path: str, extraction_type: str = "summary"):
    """
    Uploads the PDF directly to OpenAI and extracts structured data.
    """

    # Upload the file to OpenAI
    file_obj = client.files.create(
        file=open(pdf_path, "rb"),
        purpose="assistants"
    )

    # Prompt setup
    system_prompt = f"""
    You are an expert data extraction assistant.
    Extract structured and meaningful data from the uploaded PDF.
    Type of extraction: {extraction_type}.
    Always return clean JSON output.

    **Note**: Ensure to extract the correct and accurate information of the work experience field.
    """

    # Correct message format
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # You can use "gpt-4o" for better accuracy
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Please analyze this PDF and extract structured data."},
                    {"type": "file", "file": {"file_id": file_obj.id}}
                ]
            }
        ],
        temperature=0.0
    )
    text = response.choices[0].message.content
    return text