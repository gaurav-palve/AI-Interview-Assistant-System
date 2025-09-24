from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib import colors
import io
import os
from datetime import datetime

def convert_text_to_pdf(text, title=None, output_path=None):
    """
    Convert text content to a PDF file.
    
    Args:
        text (str): The text content to convert to PDF
        title (str, optional): The title of the PDF document
        output_path (str, optional): The path where the PDF will be saved.
            If not provided, a BytesIO object will be returned.
            
    Returns:
        BytesIO or str: If output_path is None, returns a BytesIO object containing the PDF.
                        Otherwise, returns the path where the PDF was saved.
    """
    # Create a BytesIO object if no output path is provided
    if output_path is None:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=72)
    else:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        doc = SimpleDocTemplate(output_path, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=72)
    
    # Create styles
    styles = getSampleStyleSheet()
    
    # Add custom styles
    styles.add(ParagraphStyle(
        name='Justify',
        parent=styles['Normal'],
        alignment=TA_JUSTIFY
    ))
    
    styles.add(ParagraphStyle(
        name='Title',
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        fontSize=16,
        spaceAfter=12
    ))
    
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.gray
    ))
    
    # Create the content
    content = []
    
    # Add title if provided
    if title:
        content.append(Paragraph(title, styles['Title']))
        content.append(Spacer(1, 0.25 * inch))
    
    # Add date
    date_str = datetime.now().strftime("%B %d, %Y")
    content.append(Paragraph(f"Generated on: {date_str}", styles['Subtitle']))
    content.append(Spacer(1, 0.25 * inch))
    
    # Process the text content
    paragraphs = text.split('\n\n')
    for para in paragraphs:
        if para.strip():
            # Check if this is a heading (starts with # or ##)
            if para.strip().startswith('# '):
                heading_text = para.strip()[2:]
                content.append(Paragraph(heading_text, styles['Heading1']))
            elif para.strip().startswith('## '):
                heading_text = para.strip()[3:]
                content.append(Paragraph(heading_text, styles['Heading2']))
            else:
                # Regular paragraph
                content.append(Paragraph(para.replace('\n', '<br/>'), styles['Justify']))
            
            content.append(Spacer(1, 0.2 * inch))
    
    # Build the PDF
    doc.build(content)
    
    # Return the result
    if output_path is None:
        buffer.seek(0)
        return buffer
    else:
        return output_path

def job_description_to_pdf(job_title, job_description, company_name=None, output_path=None):
    """
    Convert a job description to a PDF file with proper formatting.
    
    Args:
        job_title (str): The title of the job
        job_description (str): The job description text
        company_name (str, optional): The name of the company
        output_path (str, optional): The path where the PDF will be saved
            
    Returns:
        BytesIO or str: If output_path is None, returns a BytesIO object containing the PDF.
                        Otherwise, returns the path where the PDF was saved.
    """
    # Create a title with company name if provided
    if company_name:
        title = f"{job_title} - {company_name}"
    else:
        title = job_title
    
    return convert_text_to_pdf(job_description, title, output_path)