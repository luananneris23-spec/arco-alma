import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada");

    const { imageBase64, mediaType, isPDF } = await req.json();
    if (!imageBase64) throw new Error("Imagem não recebida");

    const prompt = `Você está analisando uma partitura de violoncelo escrita em clave de fá.

Sua tarefa:
1. Identifique as notas musicais da melodia principal (voz superior da clave de fá)
2. Liste-as em ordem de leitura, da esquerda para a direita
3. Use os nomes em português: Dó, Ré, Mi, Fá, Sol, Lá, Si
4. Adicione sustenidos com # (ex: Fá#) e bemóis com b (ex: Sib)
5. Adicione o número da oitava após cada nota (ex: Dó3, Ré4, Sol3)
   - Referência: corda Lá do violoncelo = Lá3, corda Ré = Ré3, corda Sol = Sol2, corda Dó = Dó2
6. Se houver pausa, escreva P
7. Máximo 40 notas (primeiros compassos apenas se for muito longa)
8. Ignore dinâmicas (f, p, mf), ligaduras, arcadas (V, n), dedilhados (0,1,2,3,4)

Responda SOMENTE com a lista de notas separadas por vírgula, sem nenhuma explicação.
Exemplo correto: Dó3, Ré3, Mi3, Fá3, Sol3, Lá3, Si3, Dó4`;

    // Build OpenAI request
    const messages: object[] = [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`,
              detail: "high",
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ];

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 600,
        temperature: 0.1,
      }),
    });

    if (!openaiResp.ok) {
      const err = await openaiResp.json();
      throw new Error(err.error?.message || `OpenAI error ${openaiResp.status}`);
    }

    const data = await openaiResp.json();
    const notes = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ notes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-score error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
