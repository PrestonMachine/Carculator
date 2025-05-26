import React, { useState } from "react";
import "./App.css";

/**
 * Калькулятор оптимального мита для лінійних функцій попиту/пропозиції
 *
 * Dd  = A  − k·P   (A – вільний член,  k – нахил)
 * Sd  = −S + b·P   (S – вільний член,  b – нахил)
 * Sw  = −S_w + bw·P (світова пропозиція)
 *
 * Pᴬ = (A + S) / (k + b)            – автаркічна ціна
 * Pʷ = (A + S + S_w) / (k + b + bw) – ціна вільної торгівлі (якщо користувач її не ввів)
 * t* = Pᴬ − Pʷ                      – оптимальне імпортне мито (для експорту – навпаки)
 */
function App() {
  const [values, setValues] = useState({
    demandIntercept: "3.6", // A
    demandSlope: "0.006666666", // k
    supplyIntercept: "1.4", // S
    supplySlope: "0.006666666", // b
    worldIntercept: "3", // S_w
    worldSlope: "0.013333333", // bw
    worldPrice: "", // необов’язково, якщо не вказано – розраховується
    tariffType: "import", // import / export (імпортне чи експортне мито)
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateInputs = (A, k, S, b, Sw, bw) => {
    const nums = [A, k, S, b, Sw, bw];
    if (nums.some((n) => Number.isNaN(n))) {
      return "Усі поля (окрім Pw) мають містити числові значення.";
    }
    if (k <= 0) return "Нахил попиту (k) повинен бути додатним.";
    if (b <= 0) return "Нахил пропозиції (b) повинен бути додатним.";
    if (bw <= 0) return "Нахил світової пропозиції (bw) повинен бути додатним.";
    return null;
  };

  const calculateResults = () => {
    try {
      const A = parseFloat(values.demandIntercept);
      const k = parseFloat(values.demandSlope);
      const S = parseFloat(values.supplyIntercept);
      const b = parseFloat(values.supplySlope);
      const Sw = parseFloat(values.worldIntercept);
      const bw = parseFloat(values.worldSlope);
      const isImport = values.tariffType === "import";

      const validationError = validateInputs(A, k, S, b, Sw, bw);
      if (validationError) {
        alert(validationError);
        return;
      }

      // 1) Автаркічна ціна
      const P_autarky = (A + S) / (k + b);

      // 2) Ціна вільної торгівлі Pw
      let Pw;
      if (values.worldPrice !== "") {
        Pw = parseFloat(values.worldPrice);
        if (Pw <= 0) {
          alert("Світова ціна не може бути від’ємною або нульовою.");
          return;
        }
      } else {
        Pw = (A + S + Sw) / (k + b + bw);
      }

      // 3) Оптимальне мито t*
      let tStar = isImport ? P_autarky - Pw : Pw - P_autarky;
      if (tStar < 0) tStar = 0; // якщо розрахунки дали від’ємне – означає, що оптимальне мито = 0

      setResult({
        "Автаркічна ціна (Pᴬ)": `${P_autarky.toFixed(6)} $/т`,
        "Ціна вільної торгівлі (Pʷ)": `${Pw.toFixed(6)} $/т`,
        "Оптимальне мито (t*)": `${tStar.toFixed(6)} $/т`,
      });
    } catch (err) {
      alert("Помилка обчислень. Перевірте введені дані.");
    }
  };

  // ——— опис полів для перебору у форму
  const inputFields = [
    {
      name: "demandIntercept",
      label: "Вільний член попиту (A)",
      formula: "Qᴅ = A − k·P",
    },
    {
      name: "demandSlope",
      label: "Нахил попиту (k)",
      formula: "Qᴅ = A − k·P",
    },
    {
      name: "supplyIntercept",
      label: "Вільний член пропозиції (S)",
      formula: "Q_s = −S + b·P",
    },
    {
      name: "supplySlope",
      label: "Нахил пропозиції (b)",
      formula: "Q_s = −S + b·P",
    },
    {
      name: "worldIntercept",
      label: "Вільний член світ. пропозиції (S_w)",
      formula: "Q_w = −S_w + bw·P",
    },
    {
      name: "worldSlope",
      label: "Нахил світ. пропозиції (bw)",
      formula: "Q_w = −S_w + bw·P",
    },
    {
      name: "worldPrice",
      label: "Світова ціна (Pw) – опціонально",
      formula: "Якщо не ввести, Pw буде розраховано",
    },
  ];

  return (
    <div className="App">
      <div className="calculator">
        <h1>Калькулятор оптимального мита</h1>

        <div className="input-container">
          <div className="input-group">
            <label>Тип мита:</label>
            <select name="tariffType" value={values.tariffType} onChange={handleChange}>
              <option value="import">Імпортне мито</option>
              <option value="export">Експортне мито</option>
            </select>
          </div>

          {inputFields.map((field) => (
            <div className="input-group" key={field.name}>
              <div className="label-container">
                <label>{field.label}</label>
                <span className="formula">{field.formula}</span>
              </div>
              <input
                type="number"
                name={field.name}
                value={values[field.name]}
                onChange={handleChange}
                step="any"
              />
            </div>
          ))}
        </div>

        <button onClick={calculateResults}>Розрахувати</button>

        {result && (
          <div className="result">
            <h2>Результати розрахунків:</h2>
            {Object.entries(result).map(([key, value]) => (
              <p key={key}>
                <span>{key}:</span> <span>{value}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
