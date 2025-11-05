from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from datetime import datetime
from io import BytesIO
import gridfs
from pymongo import MongoClient
from bson import ObjectId


# ============================================================
# 1. PDF GENERATION FUNCTION (returns pdf bytes)
# ============================================================
def build_candidate_report_pdf(report_data) -> bytes:
    """Generate the candidate report as a PDF and return it as bytes."""
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="MyHeading1", fontSize=16, leading=22, spaceAfter=10, textColor=colors.darkblue))
    styles.add(ParagraphStyle(name="MyHeading2", fontSize=13, leading=18, spaceAfter=6, textColor=colors.darkgreen))
    styles.add(ParagraphStyle(name="MyNormalText", fontSize=11, leading=16))
    styles.add(ParagraphStyle(name="MySmallText", fontSize=10, leading=14, textColor=colors.grey))
    styles.add(ParagraphStyle(name="MyMonoText", fontName="Courier", fontSize=9, leading=14, textColor=colors.darkslategray))

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []

    # ----------------------------
    # HEADER SECTION
    # ----------------------------
    candidate_name = report_data.get("candidate_name", "N/A").title()
    candidate_email = report_data.get("candidate_email", "N/A")
    job_role = report_data.get("job_role", "N/A")
    date_str = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")

    voice = report_data.get("Voice_data", {})
    avg_percent = round(voice.get("overall_score", 0) * 10, 2)

    story.append(Paragraph(f"<b>Candidate Report - {candidate_name}</b>", styles["MyHeading1"]))
    story.append(Paragraph(f"Email: {candidate_email}", styles["MyNormalText"]))
    story.append(Paragraph(f"Job Role: {job_role}", styles["MyNormalText"]))
    story.append(Paragraph(f"Date: {date_str}", styles["MyNormalText"]))
    story.append(Paragraph(f"Total Average Percent: <b>{avg_percent}%</b>", styles["MyNormalText"]))
    story.append(Spacer(1, 12))

    # ----------------------------
    # VOICE INTERVIEW SECTION
    # ----------------------------
    story.append(Paragraph("AI Interview Evaluation", styles["MyHeading2"]))
    voice_table = [
        ["Communication", f"{voice.get('communication_score', 0)}/10"],
        ["Technical", f"{voice.get('technical_score', 0)}/10"],
        ["Confidence", f"{voice.get('confidence_score', 0)}/10"],
        ["Overall", f"{voice.get('overall_score', 0)}/10"],
    ]
    vt = Table(voice_table, colWidths=[150, 100])
    vt.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
    ]))
    story.append(vt)
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Feedback:</b>", styles["MyNormalText"]))
    story.append(Paragraph(voice.get("feedback", "No feedback available."), styles["MySmallText"]))
    story.append(Spacer(1, 12))

    # Transcript Section
    transcript_texts = voice.get("transcript_texts", [])
    if transcript_texts:
        story.append(Paragraph("<b>Interview Transcript:</b>", styles["MyNormalText"]))
        for i, line in enumerate(transcript_texts, start=1):
            story.append(Paragraph(f"{i}. {line}", styles["MyMonoText"]))
        story.append(Spacer(1, 20))
    else:
        story.append(Paragraph("No transcript data available.", styles["MySmallText"]))
        story.append(Spacer(1, 20))

    # ----------------------------
    # MCQ SECTION
    # ----------------------------
    story.append(Paragraph("MCQ Evaluation", styles["MyHeading2"]))
    mcqs = report_data.get("MCQ_data", [])
    if mcqs:
        for i, q in enumerate(mcqs, start=1):
            story.append(Paragraph(f"<b>Q{i}:</b> {q['question']}", styles["MyNormalText"]))
            story.append(Paragraph(f"Candidate Answer: {q['candidate_answer']}", styles["MySmallText"]))
            story.append(Paragraph(f"Correct Answer: {q['correct_answer']}", styles["MySmallText"]))
            result = "✅ Correct" if q["is_correct"] else "❌ Incorrect"
            story.append(Paragraph(f"Result: {result}", styles["MySmallText"]))
            story.append(Spacer(1, 8))
    else:
        story.append(Paragraph("No MCQ data available.", styles["MySmallText"]))
    story.append(PageBreak())

    # ----------------------------
    # CODING SECTION
    # ----------------------------
    story.append(Paragraph("Coding Evaluation", styles["MyHeading2"]))
    coding_data = report_data.get("Coding_data", [])
    if coding_data:
        for i, c in enumerate(coding_data, start=1):
            story.append(Paragraph(f"<b>Problem {i}: {c['title']}</b>", styles["MyNormalText"]))
            answer = c.get("candidate_answer") or "No answer provided."
            if isinstance(answer, str) and len(answer) > 300:
                answer = answer[:300] + "..."
            story.append(Paragraph(f"<b>Candidate Answer:</b><br/>{answer}", styles["MySmallText"]))
            test_cases = c.get("candidate_test_cases", [])
            total_tests = len(test_cases)
            passed_tests = sum(1 for t in test_cases if t.get("passed"))
            story.append(Paragraph(f"Test Cases Passed: {passed_tests}/{total_tests}", styles["MySmallText"]))
            story.append(Paragraph(f"Score: {c.get('coding_marks', 0)}", styles["MySmallText"]))
            story.append(Spacer(1, 10))
    else:
        story.append(Paragraph("No coding data available.", styles["MySmallText"]))
    story.append(PageBreak())

    # ----------------------------
    # SMART EVALUATION SUMMARY
    # ----------------------------
    story.append(Paragraph("Smart Evaluation Summary", styles["MyHeading2"]))
    overall_score = voice.get("overall_score", 0)
    remark = "Excellent" if overall_score >= 8 else "Good" if overall_score >= 6 else "Needs Improvement"
    story.append(Paragraph(f"Overall Score: <b>{overall_score}/10</b>", styles["MyNormalText"]))
    story.append(Paragraph(f"Final Recommendation: <b>{remark}</b>", styles["MyNormalText"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Generated by AI Interview Assistant System", styles["MySmallText"]))

    # Build the PDF
    doc.build(story)
    buffer.seek(0)
    pdf_data = buffer.read()
    buffer.close()
    return pdf_data