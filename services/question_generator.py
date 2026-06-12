from groq import Groq

def generate_questions(jd_input, api_key):
    client = Groq(api_key=api_key)
    
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": f"""Based on this job description, generate exactly 8 interview questions.
                        
Job Description:
{jd_input}

Return ONLY a numbered list of 8 questions. Nothing else."""
            }
        ]
    )
    
    return response.choices[0].message.content