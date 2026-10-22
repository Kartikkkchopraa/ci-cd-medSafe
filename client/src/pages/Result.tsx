import { api } from "../api/client"
import { useMedicineStore } from "../store/medicineStore";
import { useMutation, useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axios from "axios"
import type React from "react"
import ReactMarkdown from "react-markdown"

interface MedicineResponse {
  query: string;
  type: string;
  in: string;
  detail: string;
  count: number;
  total: number;
  offset: number;
  limit: number;
  maxOffset: number;
  tookMs: number;
  results: Medicine[];
}

interface Medicine {
  medicineSctid: string;
  medicineName: string;
  "brand.brandName": string;
  "brand.brandSctid": string;
  "manufacturer.manufacturerName": string;
  "generic.sctid": string;
  "generic.genericName": string;
  lastUpdatedon: string;
  ingredients: string;

  "manufacturer.sctid"?: string;
  "manufacturer.country"?: string;
  licenseStatus?: string;
  genericDetail?: GenericDetail;
}

interface GenericDetail {
  genericSctid?: string;
  name?: string;
  doseForm?: string;
  routeOfAdministration?: string;
  ingredients?: string;
  contraIndications?: string;
  indications?: string;
  source?: string;
  lastUpdatedOn?: string;
  synonyms?: string[];
  active?: boolean;
  composition?: Composition[];
  drugTypes?: DrugType[];
}

interface Composition {
  substanceSctid?: string;
  substanceName?: string;
  unit?: string;
  strength?: string;
}

interface DrugType {
  typeName?: string;
}

const Field = ({label, value}: {label: string, value?: string | number | null}) => (
  <div>
    <dt className='text-xs uppercase tracking-wide text-white/40'>{label}</dt>
    <dd className='mt-0.5 text-sm'>{value || <span className='text-white/30'>Not available</span>}</dd>
  </div>
)

const Section = ({title, children}: {title: string, children: React.ReactNode}) => (
  <section className='mt-6'>
    <h3 className='mb-2 font-mainframe-heading text-base'>{title}</h3>
    {children}
  </section>
)

const Chip = ({children}: {children: React.ReactNode}) => (
  <span className='rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs'>{children}</span>
)

const aiMarkdown = {
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol className='list-none space-y-4 pl-0' {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul className='mt-3 list-disc space-y-2 pl-5 marker:text-white/30' {...props} />
  ),
  li: (props: React.ComponentProps<'li'>) => (
    <li className='[ol>&]:rounded-xl [ol>&]:border [ol>&]:border-white/10 [ol>&]:bg-white/5 [ol>&]:p-4 [ol>&]:[&>strong:first-child]:mb-1 [ol>&]:[&>strong:first-child]:block [ol>&]:[&>strong:first-child]:font-mainframe-heading [ol>&]:[&>strong:first-child]:text-base [ol>&]:[&>strong:first-child]:text-white' {...props} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => (
    <strong className='font-semibold text-white' {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className='mt-4 border-t border-white/10 pt-4 text-xs italic text-white/40 first:mt-0 first:border-0 first:pt-0 [li_&]:mt-0 [li_&]:border-0 [li_&]:pt-0 [li_&]:text-sm [li_&]:not-italic [li_&]:text-white/80' {...props} />
  ),
}

function Result(){
  const {medicines} = useMedicineStore();

  const results = useQueries({
    queries: medicines.map((meds) => ({
      queryKey: ["medicineDetails", meds.medicineSctid],
      queryFn: async ({signal}: {signal: AbortSignal}) => {
        const response = await axios.get<MedicineResponse>("https://drugdb.in/search", {
          params: {
            type: "medicine",
            id: meds.medicineSctid
          },
          signal
        })
        return response.data
      },
      staleTime: 5 * 60 * 1000,
    }))
  })

  const isLoading = results.some((result) => result.isPending);
  const failedCount = results.filter((result) => result.isError).length;

  const medicineDetails = results.flatMap((result) => result.data?.results ?? []);


  const aiMutation = useMutation({
    mutationFn: async (medicineDetails: Medicine[]) => {
      const result = await api.post("/aiResult", {medicineDetails})
      const data = result.data
      return typeof data === "string" ? data : data?.result ?? JSON.stringify(data, null, 2)
    },
  })

  const aiResult: string = aiMutation.data ?? ""
  const aiLoading = aiMutation.isPending
  const aiError = aiMutation.isError

  return (
    <div className='min-h-screen bg-black text-white'>
      <div className='mx-auto max-w-4xl px-5 py-10'>

        <Link to='/dashboard' className='text-sm text-white/50 transition-colors hover:text-white'>← Back to search</Link>
        <h1 className='mt-3 font-mainframe-heading text-3xl'>Medicine Analysis</h1>

        {medicines.length === 0 && (
          <p className='mt-8 text-white/50'>No medicines selected.</p>
        )}

        {medicines.length > 0 && isLoading && (
          <p className='mt-8 text-white/50'>Fetching medicine details...</p>
        )}

        {failedCount > 0 && (
          <p className='mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300'>
            Failed to fetch details for {failedCount} medicine{failedCount > 1 ? 's' : ''}.
          </p>
        )}

        <div className='mt-8 space-y-6'>
          {medicineDetails.map((medicine) => {
            const generic = medicine.genericDetail
            return (
              <article key={medicine.medicineSctid} className='rounded-2xl border border-white/10 bg-white/5 p-6'>

                <header className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <h2 className='font-mainframe-heading text-xl'>{medicine.medicineName}</h2>
                    <p className='mt-1 text-xs text-white/30'>SCTID {medicine.medicineSctid}</p>
                  </div>
                  {generic?.active !== undefined && (
                    <span className={`rounded-full px-3 py-1 text-xs ${generic.active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                      {generic.active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </header>

                <Section title='Overview'>
                  <dl className='grid gap-4 sm:grid-cols-2'>
                    <Field label='Brand' value={medicine["brand.brandName"]} />
                    <Field label='Generic' value={medicine["generic.genericName"]} />
                    <Field label='Manufacturer' value={medicine["manufacturer.manufacturerName"]} />
                    <Field label='Country' value={medicine["manufacturer.country"]} />
                    <Field label='License status' value={medicine.licenseStatus} />
                    <Field label='Ingredients' value={medicine.ingredients} />
                    <Field label='Last updated' value={medicine.lastUpdatedon} />
                  </dl>
                </Section>

                <Section title='Generic details'>
                  <dl className='grid gap-4 sm:grid-cols-2'>
                    <Field label='Name' value={generic?.name} />
                    <Field label='Dose form' value={generic?.doseForm} />
                    <Field label='Route of administration' value={generic?.routeOfAdministration} />
                    <Field label='Source' value={generic?.source} />
                    <Field label='Last updated' value={generic?.lastUpdatedOn} />
                  </dl>
                </Section>

                {!!generic?.composition?.length && (
                  <Section title='Composition'>
                    <ul className='space-y-2'>
                      {generic.composition.map((item, index) => (
                        <li key={`${item.substanceSctid}-${index}`} className='flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-sm'>
                          <span>{item.substanceName}</span>
                          <span className='text-white/50'>{item.strength} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                <Section title='Indications'>
                  <p className='text-sm leading-relaxed text-white/80'>{generic?.indications || <span className='text-white/30'>Not available</span>}</p>
                </Section>

                <Section title='Contraindications'>
                  <p className='text-sm leading-relaxed text-white/80'>{generic?.contraIndications || <span className='text-white/30'>Not available</span>}</p>
                </Section>

                {!!generic?.drugTypes?.length && (
                  <Section title='Therapeutic roles'>
                    <div className='flex flex-wrap gap-2'>
                      {generic.drugTypes.map((drug, index) => (
                        <Chip key={`${drug.typeName}-${index}`}>{drug.typeName}</Chip>
                      ))}
                    </div>
                  </Section>
                )}

                {!!generic?.synonyms?.length && (
                  <Section title='Synonyms'>
                    <ul className='list-inside list-disc space-y-1 text-sm text-white/60'>
                      {generic.synonyms.map((synonym, index) => (
                        <li key={`${synonym}-${index}`}>{synonym}</li>
                      ))}
                    </ul>
                  </Section>
                )}

              </article>
            )
          })}
        </div>

        {medicineDetails.length > 0 && (
          <section className='mt-8 rounded-2xl border border-white/10 bg-white/5 p-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <h2 className='font-mainframe-heading text-xl'>AI analysis</h2>
                <p className='mt-1 text-sm text-white/50'>Interactions and safety notes for the selected medicines.</p>
              </div>
              <button
                onClick={() => aiMutation.mutate(medicineDetails)}
                disabled={aiLoading}
                className='rounded-full bg-white px-5 py-[0.6em] text-sm text-black transition-colors hover:bg-white/80 disabled:cursor-default disabled:bg-white/30'
              >
                {aiLoading ? 'Analysing...' : aiResult ? 'Re-run analysis' : 'Process Results'}
              </button>
            </div>

            <div className='mt-5 min-h-32 rounded-xl border border-dashed border-white/15 bg-black/40 p-4'>
              {aiLoading && <p className='animate-pulse text-sm text-white/50'>Analysing selected medicines...</p>}
              {!aiLoading && aiError && <p className='text-sm text-red-300'>Could not generate the AI analysis, please try again.</p>}
              {!aiLoading && !aiError && aiResult && (
                <div className='text-sm leading-relaxed text-white/80'>
                  <ReactMarkdown components={aiMarkdown}>{aiResult}</ReactMarkdown>
                </div>
              )}
              {!aiLoading && !aiError && !aiResult && (
                <p className='text-sm text-white/30'>The AI result will appear here. Click “Process Results” to generate it.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


export default Result;
