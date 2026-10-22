import { create } from "zustand";

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
}


interface MedicineStore{
    medicines: Medicine[];
    addMedicine: (medicine: Medicine) => void;
    removeMedicine: (id: string) => void;
    clearMedicine: () => void;
};


export const useMedicineStore =  create<MedicineStore>((set) => ({
    medicines: [],

    addMedicine: (medicine)=> {
        set((state) => (
            {
                
                medicines: [
                    ...state.medicines.filter((item) => item.medicineSctid !== medicine.medicineSctid),

                    medicine,
                ]

            }
        ))
    },

    removeMedicine: (id) => {
        set((state)=>(
            {
                medicines: [
                    ...state.medicines.filter((item) => item.medicineSctid !== id)
                ]
            }
        ))
    },

    clearMedicine: () => {
        set(()=>(
            {
                medicines: []
            }
        ))
    }
}))
