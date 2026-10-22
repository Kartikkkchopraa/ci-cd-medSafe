import { api } from "../api/client"
import { useMedicineStore } from "../store/medicineStore";
import { useMutation, useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import SiteNav, { LogoutButton } from "../components/SiteNav";
import { AlertIcon, ArrowLeftIcon, PillIcon, SparkIcon, Spinner } from "../components/icons";
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
  <div className='min-w-0'>
    <dt className='eyebrow'>{label}</dt>
    <dd className='mt-1 break-words text-[15px] text-white/90'>{value || <span className='text-white/30'>—</span>}</dd>
  </div>
)

const Section = ({title, children}: {title: string, children: React.ReactNode}) => (
  <section className='mt-7'>
    <h3 className='mb-3 font-mainframe-heading text-[15px] tracking-[-0.01em] text-white'>{title}</h3>
    {children}
  </section>
)

const Chip = ({children}: {children: React.ReactNode}) => (
  <span className='rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[13px] text-white/80'>{children}</span>
)

const NotAvailable = () => <span className='text-white/30'>Not available</span>

const SkeletonCard = () => (
  <div className='surface p-6 sm:p-8' aria-hidden='true'>
    <div className='skeleton h-6 w-1/2' />
    <div className='skeleton mt-3 h-3 w-1/4' />
    <div className='mt-8 grid gap-6 sm:grid-cols-3'>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className='space-y-2'>
          <div className='skeleton h-2.5 w-16' />
          <div className='skeleton h-3.5 w-28' />
        </div>
      ))}
    </div>
  </div>
)

const aiMarkdown = {
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol className='list-none space-y-3 pl-0' {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul className='mt-3 list-disc space-y-2 pl-5 marker:text-white/30' {...props} />
  ),
  li: (props: React.ComponentProps<'li'>) => (
    <li className='[ol>&]:rounded-2xl [ol>&]:border [ol>&]:border-white/10 [ol>&]:bg-white/[0.04] [ol>&]:p-5 [ol>&]:[&>strong:first-child]:mb-1.5 [ol>&]:[&>strong:first-child]:block [ol>&]:[&>strong:first-child]:font-mainframe-heading [ol>&]:[&>strong:first-child]:text-[16px] [ol>&]:[&>strong:first-child]:font-normal [ol>&]:[&>strong:first-child]:tracking-[-0.01em] [ol>&]:[&>strong:first-child]:text-white' {...props} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => (
    <strong className='font-semibold text-white' {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className='mt-5 border-t border-white/10 pt-4 text-[13px] italic text-white/40 first:mt-0 first:border-0 first:pt-0 [li_&]:mt-0 [li_&]:border-0 [li_&]:pt-0 [li_&]:text-[15px] [li_&]:not-italic [li_&]:text-white/75' {...props} />
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

  const canAnalyse = medicineDetails.length > 0 && !isLoading

  return (
    <div className='min-h-screen bg-black text-white'>
      <SiteNav actions={<LogoutButton />} />

      <div className='mx-auto max-w-4xl px-5 pb-20 pt-6 sm:px-8 sm:pt-10'>

        <Link to='/search' className='btn btn-ghost -ml-3 px-3 py-1.5 text-[14px]'>
          <ArrowLeftIcon size={16} /> Edit list
        </Link>

        <p className='eyebrow mt-6'>Step 2 of 2</p>
        <h1 className='display mt-3'>Your medicine report</h1>

        {medicines.length > 0 && (
          <div className='mt-5 flex flex-wrap gap-2'>
            {medicines.map((m) => <Chip key={m.medicineSctid}>{m.medicineName}</Chip>)}
          </div>
        )}

        {medicines.length === 0 && (
          <div className='rise-in surface mt-10 flex flex-col items-center px-6 py-14 text-center'>
            <span className='text-white/30'><PillIcon size={32} /></span>
            <p className='mt-4 font-mainframe-heading text-[20px]'>No medicines selected</p>
            <p className='mt-2 text-[15px] text-white/50'>Add the medicines you take to see their details and interactions.</p>
            <Link to='/search' className='btn btn-primary btn-md mt-6'>Search medicines</Link>
          </div>
        )}

        {medicines.length > 0 && (
          <section className='rise-in mt-10 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 sm:p-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='max-w-md'>
                <div className='flex items-center gap-2 text-white/70'>
                  <SparkIcon size={16} />
                  <span className='eyebrow text-white/60'>AI analysis</span>
                </div>
                <h2 className='mt-2 font-mainframe-heading text-[24px] leading-tight tracking-[-0.02em]'>Interaction check</h2>
                <p className='mt-2 text-[15px] leading-snug text-white/55'>
                  Review how your medicines work together, with safety notes for each combination.
                </p>
              </div>
              <button
                type='button'
                onClick={() => aiMutation.mutate(medicineDetails)}
                disabled={aiLoading || !canAnalyse}
                className='btn btn-primary btn-md'
              >
                {aiLoading && <Spinner />}
                {aiLoading ? 'Analysing' : aiResult ? 'Run again' : 'Run check'}
              </button>
            </div>

            <div className='mt-6' aria-live='polite' aria-busy={aiLoading}>
              {aiLoading && (
                <div className='space-y-3' aria-hidden='true'>
                  <div className='skeleton h-3.5 w-11/12' />
                  <div className='skeleton h-3.5 w-4/5' />
                  <div className='skeleton h-3.5 w-3/5' />
                </div>
              )}
              {!aiLoading && aiError && (
                <p className='callout callout-error'>Could not generate the analysis. Please try again.</p>
              )}
              {!aiLoading && !aiError && aiResult && (
                <div className='rise-in text-[15px] leading-relaxed text-white/80'>
                  <ReactMarkdown components={aiMarkdown}>{aiResult}</ReactMarkdown>
                </div>
              )}
              {!aiLoading && !aiError && !aiResult && (
                <p className='rounded-2xl border border-dashed border-white/15 px-5 py-6 text-center text-[14px] text-white/40'>
                  {isLoading ? 'Loading medicine details…' : 'Run the check to see interactions and safety notes here.'}
                </p>
              )}
            </div>

            <p className='mt-6 border-t border-white/10 pt-4 text-[12px] leading-snug text-white/40'>
              AI-generated and for information only. Always confirm with your doctor or pharmacist before changing how you take any medicine.
            </p>
          </section>
        )}

        {failedCount > 0 && (
          <p role='alert' className='callout callout-error mt-6'>
            Failed to fetch details for {failedCount} medicine{failedCount > 1 ? 's' : ''}.
          </p>
        )}

        {medicines.length > 0 && <p className='eyebrow mt-14'>Medicine details</p>}

        <div className='mt-4 space-y-5'>
          {isLoading && medicines.map((m) => <SkeletonCard key={m.medicineSctid} />)}

          {!isLoading && medicineDetails.map((medicine, index) => {
            const generic = medicine.genericDetail
            return (
              <article
                key={medicine.medicineSctid}
                style={{ animationDelay: `${index * 60}ms` }}
                className='rise-in surface p-6 sm:p-8'
              >
                <header className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <h2 className='font-mainframe-heading text-[22px] leading-tight tracking-[-0.02em] sm:text-[26px]'>{medicine.medicineName}</h2>
                    {medicine["generic.genericName"] && (
                      <p className='mt-1.5 text-[15px] text-white/55'>{medicine["generic.genericName"]}</p>
                    )}
                  </div>
                  {generic?.active !== undefined && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] ${generic.active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${generic.active ? 'bg-emerald-300' : 'bg-red-300'}`} />
                      {generic.active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </header>

                <dl className='mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3'>
                  <Field label='Brand' value={medicine["brand.brandName"]} />
                  <Field label='Manufacturer' value={medicine["manufacturer.manufacturerName"]} />
                  <Field label='Country' value={medicine["manufacturer.country"]} />
                  <Field label='Dose form' value={generic?.doseForm} />
                  <Field label='Route' value={generic?.routeOfAdministration} />
                  <Field label='License status' value={medicine.licenseStatus} />
                </dl>

                {!!generic?.composition?.length && (
                  <Section title='Composition'>
                    <ul className='divide-y divide-white/[0.07] overflow-hidden rounded-2xl bg-white/[0.04]'>
                      {generic.composition.map((item, i) => (
                        <li key={`${item.substanceSctid}-${i}`} className='flex items-center justify-between gap-4 px-4 py-3 text-[15px]'>
                          <span>{item.substanceName}</span>
                          <span className='shrink-0 tabular-nums text-white/55'>{item.strength} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                <Section title='Used for'>
                  <p className='text-[15px] leading-relaxed text-white/75'>{generic?.indications || <NotAvailable />}</p>
                </Section>

                <Section title='Do not use if'>
                  {generic?.contraIndications ? (
                    <div className='callout callout-caution flex gap-3 text-[15px] leading-relaxed'>
                      <span className='mt-0.5 shrink-0 text-amber-300'><AlertIcon size={18} /></span>
                      <p>{generic.contraIndications}</p>
                    </div>
                  ) : (
                    <p className='text-[15px]'><NotAvailable /></p>
                  )}
                </Section>

                {!!generic?.drugTypes?.length && (
                  <Section title='Therapeutic roles'>
                    <div className='flex flex-wrap gap-2'>
                      {generic.drugTypes.map((drug, i) => (
                        <Chip key={`${drug.typeName}-${i}`}>{drug.typeName}</Chip>
                      ))}
                    </div>
                  </Section>
                )}

                <details className='group mt-7 border-t border-white/10 pt-4'>
                  <summary className='flex cursor-pointer list-none items-center justify-between rounded-full text-[14px] text-white/55 transition-colors hover:text-white [&::-webkit-details-marker]:hidden'>
                    More details
                    <span aria-hidden='true' className='transition-transform duration-200 group-open:rotate-45'>+</span>
                  </summary>
                  <div className='pt-5'>
                    <dl className='grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3'>
                      <Field label='Ingredients' value={medicine.ingredients} />
                      <Field label='Source' value={generic?.source} />
                      <Field label='Last updated' value={generic?.lastUpdatedOn || medicine.lastUpdatedon} />
                      <Field label='Medicine SCTID' value={medicine.medicineSctid} />
                      <Field label='Generic SCTID' value={medicine["generic.sctid"]} />
                    </dl>
                    {!!generic?.synonyms?.length && (
                      <Section title='Also known as'>
                        <div className='flex flex-wrap gap-2'>
                          {generic.synonyms.map((synonym, i) => (
                            <Chip key={`${synonym}-${i}`}>{synonym}</Chip>
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>
                </details>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  );
}


export default Result;
