import type { Request, Response } from "express";
import OpenAI from "openai";
import config from "../config/config.js";

const client = new OpenAI({apiKey: config.OPENAI_API_KEY}); // reads OPENAI_API_KEY from env

const MODEL = config.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a clinical pharmacology assistant inside a medicine information app.
You will receive details of medicines a user has selected. Write a concise analysis with these sections:

1. Overview - what each medicine is used for, in one line each.
2. Interactions - possible interactions between the selected medicines, or "No significant interactions found in the provided data".
3. Duplicate ingredients - if two medicines share an active ingredient, warn about double dosing.
4. Cautions - key contraindications to be aware of.

Base your answer on the data provided and well-established pharmacology. Use plain language.
Do not give personal dosing advice. End with one line saying this is informational only and a doctor or pharmacist should be consulted.`;

export const getAiResult = async (req: Request, res: Response) => {
  try {
    const { medicineDetails } = req.body;

    if (!Array.isArray(medicineDetails) || medicineDetails.length === 0) {
      return res.status(400).json({ message: "medicineDetails must be a non-empty array" });
    }
    if (medicineDetails.length > 20) {
      return res.status(400).json({ message: "Too many medicines selected (max 20)" });
    }

    // Send only the fields the model needs, to keep the prompt small
    const slim = medicineDetails.map((m: any) => ({
      name: m.medicineName,
      brand: m["brand.brandName"],
      generic: m["generic.genericName"],
      manufacturer: m["manufacturer.manufacturerName"],
      doseForm: m.genericDetail?.doseForm,
      route: m.genericDetail?.routeOfAdministration,
      composition: m.genericDetail?.composition,
      indications: m.genericDetail?.indications,
      contraindications: m.genericDetail?.contraIndications,
      drugTypes: m.genericDetail?.drugTypes?.map((d: any) => d.typeName),
    }));

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyse these selected medicines:\n\n${JSON.stringify(slim, null, 2)}`,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content ?? "";

    return res.json({ result });
  } catch (error) {
    console.error("aiResult error:", error);
    return res.status(500).json({ message: "Failed to generate AI analysis" });
  }
};
