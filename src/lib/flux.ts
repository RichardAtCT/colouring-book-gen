export async function generateWithFlux(
  prompt: string
): Promise<{ imageBase64: string }> {
  // Submit generation request
  const submitResponse = await fetch("https://api.bfl.ml/v1/flux-pro-1.1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Key": process.env.BFL_API_KEY!,
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024,
      prompt_upsampling: false,
    }),
  });

  if (!submitResponse.ok) {
    throw new Error(`FLUX API submit failed: ${submitResponse.status}`);
  }

  const { id } = await submitResponse.json();

  // Poll for result (max 120 seconds)
  for (let i = 0; i < 60; i++) {
    const statusResponse = await fetch(
      `https://api.bfl.ml/v1/get_result?id=${id}`,
      { headers: { "X-Key": process.env.BFL_API_KEY! } }
    );

    const statusData = await statusResponse.json();

    if (statusData.status === "Ready") {
      // Download the image and convert to base64
      const imageResponse = await fetch(statusData.result.sample);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      return { imageBase64 };
    }

    if (statusData.status === "Error") {
      throw new Error("FLUX generation failed");
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("FLUX generation timed out");
}
