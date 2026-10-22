import React, { useState } from 'react'
import useDebouncing from '../hooks/useDebounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useMedicineStore } from '../store/medicineStore';



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


const SearchAndSelect = () => {

    const [search , setSearch] = useState<string>("");
    
    const {medicines, addMedicine, removeMedicine, clearMedicine} = useMedicineStore();

    
    const debouncedSearch = useDebouncing(search, 300);


    const PAGE_SIZE = 25

    const {data, isFetching, isFetchingNextPage, isError, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey : ["search", debouncedSearch],
        initialPageParam: 0,
        queryFn : async({signal, pageParam}) => {
            const result = await axios.get<MedicineResponse>("https://drugdb.in/search",{
                params:{
                    type: "medicine",
                    in : "all",
                    limit: PAGE_SIZE,
                    offset: pageParam,
                    q: debouncedSearch
                },
                signal
            })

            return result.data;
        },
        getNextPageParam: (lastPage) => {
            const next = lastPage.offset + lastPage.count
            return next < lastPage.total && next <= lastPage.maxOffset ? next : undefined
        },

        enabled: debouncedSearch.trim().length > 0
    })

    const total = data?.pages[0]?.total ?? 0
    const results = Array.from(
        new Map((data?.pages.flatMap((page) => page.results) ?? []).map((m) => [m.medicineSctid, m])).values()
    )


  const hasQuery = debouncedSearch.trim().length > 0
  const selectedIds = new Set(medicines.map((m) => m.medicineSctid))

  return (
    <div className='min-h-screen bg-black text-white'>
      <div className='mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_340px]'>

        <main>
          <h1 className='font-mainframe-heading text-3xl'>Search medicines</h1>
          <p className='mt-1 text-sm text-white/50'>Find a medicine and add it to your list.</p>

          <input
            type='text'
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder='Try dolo, paracetamol, amoxicillin...'
            className='mt-6 w-full rounded-full border border-white/20 bg-white/5 px-5 py-[0.7em] text-[15px] text-white placeholder:text-white/40 transition-colors focus:border-white focus:outline-none'
          />

          <div className='mt-3 h-5 text-sm'>
            {isFetching && !isFetchingNextPage && <span className='text-white/50'>Fetching results...</span>}
            {isError && <span className='text-red-400'>Something went wrong, please try again.</span>}
            {!isFetching && !isError && hasQuery && data && (
              <span className='text-white/50'>{results.length} of {total} results</span>
            )}
          </div>

          <ul className='mt-2 space-y-3'>
            {hasQuery && results.map((item)=>{
              const isSelected = selectedIds.has(item.medicineSctid)
              return (
                <li
                  key={item.medicineSctid}
                  className='flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/30'
                >
                  <div className='min-w-0'>
                    <p className='font-bold'>{item.medicineName}</p>
                    <p className='mt-1 text-sm text-white/60'>
                      {item['brand.brandName']} · {item['manufacturer.manufacturerName']}
                    </p>
                    <p className='mt-1 text-xs text-white/30'>{item.medicineSctid}</p>
                  </div>
                  <button
                    onClick={() => addMedicine(item)}
                    disabled={isSelected}
                    className={`shrink-0 rounded-full px-4 py-[0.4em] text-sm transition-colors ${
                      isSelected
                        ? 'cursor-default border border-white/20 text-white/40'
                        : 'bg-white text-black hover:bg-white/80'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </li>
              )
            })}
          </ul>

          {hasQuery && hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className='mt-5 w-full rounded-full border border-white/20 px-5 py-[0.6em] text-sm transition-colors hover:border-white disabled:cursor-default disabled:text-white/40 disabled:hover:border-white/20'
            >
              {isFetchingNextPage ? 'Loading...' : 'Show more'}
            </button>
          )}

          {hasQuery && !isFetching && data && results.length === 0 && (
            <p className='mt-6 text-center text-white/50'>No medicines found for “{debouncedSearch.trim()}”.</p>
          )}
        </main>

        <aside className='h-fit rounded-2xl border border-white/10 bg-white/5 p-5 lg:sticky lg:top-6'>
          <div className='flex items-center justify-between'>
            <h2 className='font-mainframe-heading text-lg'>Selected ({medicines.length})</h2>
            {medicines.length > 0 && (
              <button onClick={()=> clearMedicine()} className='text-sm text-white/50 transition-colors hover:text-white'>
                Clear all
              </button>
            )}
          </div>

          {medicines.length > 0 && (
            <Link to='/results' className='mt-4 block rounded-full bg-white px-4 py-[0.5em] text-center text-sm text-black transition-colors hover:bg-white/80'>
              View analysis
            </Link>
          )}

          {medicines.length === 0 ? (
            <p className='mt-4 text-sm text-white/40'>Nothing selected yet.</p>
          ) : (
            <ul className='mt-4 space-y-2'>
              {medicines.map((item) => (
                <li key={item.medicineSctid} className='flex items-start justify-between gap-3 rounded-xl bg-white/5 p-3'>
                  <div className='min-w-0'>
                    <p className='text-sm font-bold'>{item.medicineName}</p>
                    <p className='text-xs text-white/50'>{item['brand.brandName']} · {item['manufacturer.manufacturerName']}</p>
                  </div>
                  <button
                    onClick={() => removeMedicine(item.medicineSctid)}
                    aria-label={`Remove ${item.medicineName}`}
                    className='shrink-0 text-white/40 transition-colors hover:text-white'
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

      </div>
    </div>
  )
}

export default SearchAndSelect
