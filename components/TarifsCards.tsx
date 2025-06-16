import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function TarifsCards() {
  const [tarifs, setTarifs] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "content", "fr"), (snapshot) => {
      if (snapshot.exists()) {
        setTarifs(snapshot.data().tarifs || []);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="py-12 px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tarifs.map((item, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-6 border border-[#e4d5c4]">
            <h3 className="text-xl font-semibold text-[#6E4E32] mb-2">{item.titre}</h3>
            <p className="text-[#D67B4C] text-lg font-medium">{item.prix}</p>
            <p className="text-gray-600 mt-2">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
