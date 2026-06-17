from groq import Groq

def generate_questions(resume_text, jd_input, api_key):
    client = Groq(api_key=api_key)
    
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": f"""
You are an experienced technical interviewer.

Generate exactly 8 realistic interview questions using BOTH the candidate's resume and the job description.

Candidate Resume:
{resume_text}

Job Description:
{jd_input}

Question distribution:
- 2 introductory questions
- 2 resume-based questions
- 3 job-description-based questions
- 1 behavioral question

Rules:
- Ask only about skills, technologies, projects, and experiences mentioned in the resume or job description.
- Do NOT ask about technologies that are not mentioned in either document.
- Questions should feel like a real internship interview.
- Mix technical and non-technical questions.

Return ONLY a numbered list of 8 questions.
"""
            }
        ]
    )
    
    return response.choices[0].message.content