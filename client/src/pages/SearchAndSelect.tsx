import { useRef, useState } from 'react'
import useDebouncing from '../hooks/useDebounce';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useMedicineStore } from '../store/medicineStore';
import SiteNav, { LogoutButton } from '../components/SiteNav';
import { ArrowRightIcon, CheckIcon, CloseIcon, PillIcon, PlusIcon, SearchIcon, Spinner } from '../components/icons';

const SUGGESTIONS = ['Dolo 650', 'Paracetamol', 'Amoxicillin', 'Metformin', 'Atorvastatin']



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
    const inputRef = useRef<HTMLInputElement>(null);
    
    const {medicines, addMedicine, removeMedicine, clearMedicine} = useMedicineStore();

    
    const debouncedSearch = useDebouncing(search, 200);

    // Holds a cleared list so "Clear all" can be undone
    const [cleared, setCleared] = useState<typeof medicines | null>(null);

    // The mobile tray slides out showing what it last held, not an empty "0 selected"
    const lastSelected = useRef(medicines);
    if (medicines.length > 0) lastSelected.current = medicines;


    const PAGE_SIZE = 25

    const {data, isFetching, isFetchingNextPage, isError, isPlaceholderData, hasNextPage, fetchNextPage} = useInfiniteQuery({
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

        enabled: debouncedSearch.trim().length > 0,
        // Keep the last results on screen while the next query loads, so the list never blanks out mid-typing
        placeholderData: keepPreviousData,
    })

    const total = data?.pages[0]?.total ?? 0
    const results = Array.from(
        new Map((data?.pages.flatMap((page) => page.results) ?? []).map((m) => [m.medicineSctid, m])).values()
    )


  const hasQuery = debouncedSearch.trim().length > 0
  const selectedIds = new Set(medicines.map((m) => m.medicineSctid))
  const isInitialLoad = hasQuery && isFetching && !isFetchingNextPage && results.length === 0
  const toggle = (item: Medicine) => {
    setCleared(null)
    if (selectedIds.has(item.medicineSctid)) removeMedicine(item.medicineSctid)
    else addMedicine(item)
  }

  const clearAll = () => {
    setCleared(medicines)
    clearMedicine()
  }

  const undoClear = () => {
    cleared?.forEach(addMedicine)
    setCleared(null)
  }

  const clearSearch = () => {
    setSearch("")
    inputRef.current?.focus()
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      <SiteNav actions={<LogoutButton />} />

      <div className='mx-auto grid max-w-6xl gap-10 px-5 pb-36 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-[1fr_340px] lg:pb-20'>

        <main className='min-w-0'>
          <p className='eyebrow'>Step 1 of 2</p>
          <h1 className='display mt-3'>Which medicines are you taking?</h1>
          <p className='mt-3 max-w-lg text-[16px] leading-snug text-white/60 sm:text-[17px]'>
            Search by brand or generic name and add each one to your list. We&apos;ll check them together.
          </p>

          <div className='relative mt-8'>
            <span className='pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45'>
              <SearchIcon size={20} />
            </span>
            <input
              ref={inputRef}
              type='search'
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
              placeholder='Try dolo, paracetamol, amoxicillin...'
              aria-label='Search medicines'
              autoFocus
              className='field py-[0.9em] pl-[3.25rem] pr-14 text-[16px] sm:text-[17px] [&::-webkit-search-cancel-button]:hidden'
            />
            <div className='absolute right-2 top-1/2 flex -translate-y-1/2 items-center'>
              {isFetching && !isFetchingNextPage ? (
                <span className='px-3 text-white/60'><Spinner /></span>
              ) : search && (
                <button type='button' onClick={clearSearch} aria-label='Clear search' className='btn btn-ghost h-9 w-9'>
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
          </div>

          <div className='mt-3 min-h-5 pl-5 text-[13px]' aria-live='polite'>
            {isError && <span className='text-red-400'>Something went wrong, please try again.</span>}
            {!isFetching && !isError && hasQuery && data && results.length > 0 && (
              <span className='text-white/45'>Showing {results.length} of {total.toLocaleString()} results</span>
            )}
          </div>

          {!search.trim() && (
            <div className='rise-in mt-4'>
              <p className='eyebrow'>Popular searches</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {SUGGESTIONS.map((term) => (
                  <button key={term} type='button' onClick={() => setSearch(term)} className='btn btn-secondary btn-sm'>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isInitialLoad && (
            <ul className='mt-2 space-y-3' aria-hidden='true'>
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className='surface flex items-center justify-between gap-4 rounded-2xl p-5'>
                  <div className='flex-1 space-y-2.5'>
                    <div className='skeleton h-4 w-2/5' />
                    <div className='skeleton h-3 w-3/5' />
                  </div>
                  <div className='skeleton h-9 w-20' />
                </li>
              ))}
            </ul>
          )}

          {hasQuery && results.length > 0 && (
            <ul className={`mt-2 space-y-3 transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50' : ''}`} aria-busy={isPlaceholderData}>
              {results.map((item, index)=>{
                const isSelected = selectedIds.has(item.medicineSctid)
                return (
                  <li
                    key={item.medicineSctid}
                    style={{ animationDelay: `${Math.min(index % PAGE_SIZE, 8) * 30}ms` }}
                    className={`rise-in flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors duration-200 sm:p-5 ${
                      isSelected ? 'border-white/40 bg-white/[0.08]' : 'border-white/10 bg-white/[0.04] hover:border-white/25'
                    }`}
                  >
                    <div className='min-w-0'>
                      <p className='font-mainframe-heading text-[16px] tracking-[-0.01em] sm:text-[17px]'>{item.medicineName}</p>
                      <p className='mt-1 truncate text-[14px] text-white/55'>
                        {[item['brand.brandName'], item['manufacturer.manufacturerName']].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => toggle(item)}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Remove' : 'Add'} ${item.medicineName}`}
                      className={`btn btn-sm shrink-0 ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {isSelected ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
                      {isSelected ? 'Added' : 'Add'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {hasQuery && hasNextPage && !isPlaceholderData && (
            <button
              type='button'
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className='btn btn-secondary btn-md mt-5 w-full'
            >
              {isFetchingNextPage && <Spinner />}
              {isFetchingNextPage ? 'Loading' : 'Show more'}
            </button>
          )}

          {hasQuery && !isFetching && data && results.length === 0 && (
            <div className='rise-in mt-6 surface px-6 py-10 text-center'>
              <p className='font-mainframe-heading text-[18px]'>No matches for “{debouncedSearch.trim()}”</p>
              <p className='mt-2 text-[14px] text-white/50'>Check the spelling, or try the generic name instead.</p>
            </div>
          )}
        </main>

        {/* Desktop: sticky list beside results */}
        <aside className='hidden lg:block'>
          <div className='surface sticky top-24 p-5'>
            <div className='flex items-center justify-between'>
              <h2 className='font-mainframe-heading text-[18px] tracking-[-0.01em]'>
                Your list
                <span className='ml-2 rounded-full bg-white/10 px-2 py-0.5 align-middle text-[12px] text-white/70'>{medicines.length}</span>
              </h2>
              {medicines.length > 0 && (
                <button type='button' onClick={clearAll} className='btn btn-ghost px-3 py-1 text-[13px]'>
                  Clear all
                </button>
              )}
            </div>

            {medicines.length === 0 && cleared?.length ? (
              <div role='status' className='rise-in mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] py-3 pl-4 pr-2'>
                <p className='text-[14px] text-white/60'>
                  Cleared {cleared.length} medicine{cleared.length > 1 ? 's' : ''}
                </p>
                <button type='button' onClick={undoClear} className='btn btn-secondary btn-sm'>
                  Undo
                </button>
              </div>
            ) : medicines.length === 0 ? (
              <div className='mt-5 flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center'>
                <span className='text-white/30'><PillIcon size={28} /></span>
                <p className='mt-3 text-[14px] text-white/45'>Medicines you add will appear here.</p>
              </div>
            ) : (
              <ul className='mt-4 space-y-2'>
                {medicines.map((item) => (
                  <li key={item.medicineSctid} className='rise-in flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] py-3 pl-4 pr-2'>
                    <div className='min-w-0'>
                      <p className='truncate text-[14px] text-white'>{item.medicineName}</p>
                      <p className='truncate text-[12px] text-white/45'>{item['manufacturer.manufacturerName']}</p>
                    </div>
                    <button
                      type='button'
                      onClick={() => removeMedicine(item.medicineSctid)}
                      aria-label={`Remove ${item.medicineName}`}
                      className='btn btn-ghost h-8 w-8 shrink-0'
                    >
                      <CloseIcon size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {medicines.length > 0 && (
              <Link to='/results' className='btn btn-primary btn-md mt-5 w-full'>
                Check {medicines.length > 1 ? 'interactions' : 'medicine'}
                <ArrowRightIcon size={16} />
              </Link>
            )}
            {medicines.length === 1 && (
              <p className='mt-3 text-center text-[12px] text-white/40'>Add another to check how they interact.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile: translucent tray pinned to the bottom */}
      {/* Stays mounted so it leaves along the same path it arrived on */}
      <div
        data-hidden={medicines.length === 0}
        inert={medicines.length === 0}
        className='tray material fixed inset-x-0 bottom-0 z-20 border-t border-white/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 lg:hidden'
      >
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4'>
          <div className='min-w-0'>
            <p className='text-[14px] text-white'>{lastSelected.current.length} selected</p>
            <p className='truncate text-[12px] text-white/50'>{lastSelected.current.map((m) => m.medicineName).join(', ')}</p>
          </div>
          <Link to='/results' className='btn btn-primary btn-md shrink-0'>
            Check <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SearchAndSelect
