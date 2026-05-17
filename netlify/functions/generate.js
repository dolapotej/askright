exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured on server." }),
    };
  }

  let jobTitle;
  try {
    const body = JSON.parse(event.body);
    jobTitle = body.jobTitle?.trim();
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body." }),
    };
  }

  if (!jobTitle) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "jobTitle is required." }),
    };
  }

  const prompt = `You are a senior HR professional and expert interviewer. Generate exactly 3 thoughtful, behavioural interview questions for a "${jobTitle}" role.

Requirements:
- Each question should reveal real competency, judgement, or past experience
- Cover 3 distinct dimensions of the role (e.g. technical skill, collaboration, problem-solving)
- Questions must feel specific to this role — not generic
- No explanations, tips, preamble, or labels — ONLY the 3 questions
- Format: numbered list starting with 1.

Role: ${jobTitle}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `Gemini error (${res.status})`;
      return { statusCode: res.status, body: JSON.stringify({ error: msg }) };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to reach Gemini. Please try again.",
      }),
    };
  }
};
