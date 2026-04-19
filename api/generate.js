async function generate() {
  const topic = document.getElementById("topic").value;
  const mode = document.getElementById("mode").value;

  const resultBox = document.getElementById("result");
  resultBox.innerText = "Loading...";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        topic: topic,
        mode: mode
      })
    });

    if (!response.ok) {
      throw new Error("API failed");
    }

    const data = await response.json();

    if (data.success) {
      resultBox.innerText = data.result;
    } else {
      resultBox.innerText = "❌ " + data.error;
    }

  } catch (error) {
    resultBox.innerText = "❌ No AI response";
    console.error(error);
  }
}
