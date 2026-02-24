import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";

const TwitterStats = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/stats/tweets-per-user")
      .then((response) => {
        if (!response.ok) throw new Error("Server error");
        return response.json();
      })
      .then((data) => {
        console.log("Podaci stigli u komponentu:", data);
        
        // TRANSFORMACIJA: Osiguravamo da su podaci u formatu koji Google traži
        if (data && data.length > 1) {
          const cleanData = data.map((row, index) => {
            if (index === 0) return row; // Zaglavlje ostaje isto
            return [String(row[0]), Number(row[1])]; // Ime je string, broj je Number
          });
          setChartData(cleanData);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Greška:", error);
        setLoading(false);
      });
  }, []);

  const options = {
    title: "Aktivnost korisnika",
    pieHole: 0.4,
    is3D: false,
    legend: { position: "bottom" },
    // Dodajemo fiksne ivice da grafikon ne pobegne
    chartArea: { width: '80%', height: '80%' }
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ color: "black" }}>Statistika Tvitova</h2>
      
      {/* Ako su podaci stigli, prikazujemo Chart u fiksnom kontejneru */}
      {!loading && chartData.length > 1 ? (
        <div style={{ width: "600px", height: "400px", border: "1px solid #eee" }}>
          <Chart
            chartType="PieChart"
            width="600px"
            height="400px"
            data={chartData}
            options={options}
            loader={<div>Učitavanje grafikona...</div>}
          />
        </div>
      ) : (
        <div style={{ color: "black", marginTop: "20px" }}>
          {loading ? "Učitavanje iz baze..." : "Nema dovoljno podataka u bazi za prikaz grafikona."}
        </div>
      )}
    </div>
  );
};

export default TwitterStats;