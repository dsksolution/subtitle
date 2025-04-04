document.getElementById("translator-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get uploaded file and target language
    const fileInput = document.getElementById("file");
    const targetLanguage = document.getElementById("language").value;

    if (!fileInput.files.length) {
        alert("Please upload an SRT file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
        const srtContent = reader.result;

        try {
            // Parse SRT content into blocks
            const subtitles = parseSRT(srtContent);

            // Translate each subtitle block
            const translatedSubtitles = await translateSubtitles(subtitles, targetLanguage);

            // Generate translated SRT content
            const translatedSRT = generateSRT(translatedSubtitles);

            // Display download link
            displayDownloadLink(translatedSRT, file.name.replace(".srt", `_translated_${targetLanguage}.srt`));
        } catch (error) {
            console.error(error);
            alert("An error occurred during translation.");
        }
    };

    reader.readAsText(file);
});

// Parse SRT content into blocks
function parseSRT(srtContent) {
    const blocks = srtContent.split(/\n\n+/);
    return blocks.map(block => {
        const lines = block.split("\n");
        return {
            index: lines[0],
            timestamps: lines[1],
            text: lines.slice(2).join(" ")
        };
    });
}

// Translate subtitles using OpenRouter API
async function translateSubtitles(subtitles, targetLanguage) {
    const OPENROUTER_API_KEY = "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"; // Replace with your API key
    const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    const translatedSubtitles = [];

    for (const subtitle of subtitles) {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-4",
                messages: [
                    { role: "system", content: `You are a professional translator. Translate the following text into ${targetLanguage}.` },
                    { role: "user", content: subtitle.text }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const translatedText = data.choices[0].message.content;

        translatedSubtitles.push({
            index: subtitle.index,
            timestamps: subtitle.timestamps,
            text: translatedText
        });
    }

    return translatedSubtitles;
}

// Generate SRT content from translated subtitles
function generateSRT(subtitles) {
    return subtitles.map(subtitle => {
        return `${subtitle.index}\n${subtitle.timestamps}\n${subtitle.text}`;
    }).join("\n\n");
}

// Display download link for translated SRT
function displayDownloadLink(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = `
        <p>Translation complete! Download your translated subtitles:</p>
        <a href="${url}" download="${filename}">${filename}</a>
    `;
}