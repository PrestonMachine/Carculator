import React, { useState } from 'react';
import './App.css';

function App() {
  const [values, setValues] = useState({
    // Функція попиту: Dd = -kPd + a
    demandK: '1',    // нахил попиту (k, наприклад, 1 або 2)
    demandA: '',    // вільний член попиту (a, наприклад, 600 або 5)
    
    // Функція пропозиції: Sd = bPd - c
    supplyB: '',    // коефіцієнт при ціні в пропозиції (b, наприклад, 3 або 1)
    supplyC: '',    // вільний член пропозиції (c, наприклад, 100 або 1)
    
    worldPrice: '', // світова ціна Pw
    actualTariff: '', // фактичне мито
    tariffType: 'import', // тип мита
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const validateInputs = (k, a, b, c, Pw, T) => {
    if (isNaN(k) || isNaN(a) || isNaN(b) || isNaN(c) || isNaN(Pw) || isNaN(T)) {
      return "Усі поля повинні бути заповнені числовими значеннями.";
    }
    if (k <= 0) return "Нахил попиту (k) повинен бути додатним.";
    if (a < 0) return "Вільний член попиту (a) не може бути від’ємним.";
    if (b < 0) return "Коефіцієнт при ціні в пропозиції (b) не може бути від’ємним.";
    if (b + k === 0) return "Сума нахилів (k + b) не може дорівнювати 0.";
    if (Pw < 0 || T < 0) return "Світова ціна та мито не можуть бути від’ємними.";
    return null;
  };

  const calculateResults = () => {
    try {
      const k = parseFloat(values.demandK);     // нахил попиту
      const a = parseFloat(values.demandA);     // вільний член попиту
      const b = parseFloat(values.supplyB);     // коефіцієнт при ціні в пропозиції
      const c = parseFloat(values.supplyC);     // вільний член пропозиції
      const Pw = parseFloat(values.worldPrice); // світова ціна
      const T = parseFloat(values.actualTariff); // фактичне мито
      const isImport = values.tariffType === 'import';

      // Валідація введених даних
      const validationError = validateInputs(k, a, b, c, Pw, T);
      if (validationError) {
        alert(validationError);
        return;
      }

      // Автоматичне визначення одиниць залежно від типу мита
      const priceUnit = isImport ? 'тис. дол' : 'дол';
      const quantityUnit = isImport ? 'тис. од' : 'млн т';

      // Розрахунок внутрішньої рівноважної ціни (автаркії)
      const domesticPrice = (a + c) / (k + b);

      // Перевірка, чи автаркічна ціна додатна
      if (domesticPrice <= 0) {
        alert("Автаркічна ціна не може бути від’ємною або дорівнювати нулю. Перевірте параметри.");
        return;
      }

      // Розрахунок обсягів при рівноважній ціні
      const domesticDemand = -k * domesticPrice + a;
      const domesticSupply = b * domesticPrice - c;

      // Перевірка, чи попит і пропозиція невід’ємні при автаркічній ціні
      if (domesticDemand < 0 || domesticSupply < 0) {
        alert("Попит або пропозиція при автаркічній ціні не можуть бути від’ємними. Перевірте параметри.");
        return;
      }

      // Розрахунок оптимального мита
      let optimalTariff;
      if (isImport) {
        // Для імпортного мита
        optimalTariff = domesticPrice > Pw ? domesticPrice - Pw : 0;
      } else {
        // Для експортного мита
        optimalTariff = Pw > domesticPrice ? Pw - domesticPrice : 0;
      }

      // Різниця між оптимальним і фактичним митом
      const tariffDifference = Math.abs(optimalTariff - T);

      // Розрахунок обсягів торгівлі при світовій ціні
      const tradeDemand = -k * Pw + a;
      const tradeSupply = b * Pw - c;

      // Перевірка, чи попит і пропозиція невід’ємні при світовій ціні
      if (tradeDemand < 0 || tradeSupply < 0) {
        alert("Попит або пропозиція при світовій ціні не можуть бути від’ємними. Перевірте параметри.");
        return;
      }

      const tradeVolume = isImport 
        ? Math.max(tradeDemand - tradeSupply, 0)  // для імпорту
        : Math.max(tradeSupply - tradeDemand, 0); // для експорту

      // Розрахунок обсягів торгівлі з урахуванням мита
      const adjustedPrice = isImport ? Pw + T : Pw - T;
      if (adjustedPrice < 0) {
        alert("Ціна з урахуванням мита не може бути від’ємною. Перевірте параметри.");
        return;
      }

      const tradeDemandWithTariff = -k * adjustedPrice + a;
      const tradeSupplyWithTariff = b * adjustedPrice - c;

      // Перевірка, чи попит і пропозиція невід’ємні з урахуванням мита
      if (tradeDemandWithTariff < 0 || tradeSupplyWithTariff < 0) {
        alert("Попит або пропозиція з урахуванням мита не можуть бути від’ємними. Перевірте параметри.");
        return;
      }

      const tradeVolumeWithTariff = isImport 
        ? Math.max(tradeDemandWithTariff - tradeSupplyWithTariff, 0)
        : Math.max(tradeSupplyWithTariff - tradeDemandWithTariff, 0);

      setResult({
        'Внутрішня рівноважна ціна': `${domesticPrice.toFixed(2)} ${priceUnit}`,
        'Оптимальне мито': `${optimalTariff.toFixed(2)} ${priceUnit}`,
        'Фактичне мито': `${T.toFixed(2)} ${priceUnit}`,
        'Різниця між оптимальним і фактичним митом': `${tariffDifference.toFixed(2)} ${priceUnit}`,
        'Внутрішній попит (автаркія)': `${domesticDemand.toFixed(2)} ${quantityUnit}`,
        'Внутрішня пропозиція (автаркія)': `${domesticSupply.toFixed(2)} ${quantityUnit}`,
        [isImport ? 'Обсяг імпорту (без мита)' : 'Обсяг експорту (без мита)']: `${tradeVolume.toFixed(2)} ${quantityUnit}`,
        [isImport ? 'Обсяг імпорту (з митом)' : 'Обсяг експорту (з митом)']: `${tradeVolumeWithTariff.toFixed(2)} ${quantityUnit}`,
      });
    } catch (error) {
      alert('Помилка в розрахунках. Перевірте введені дані.');
    }
  };

  const inputFields = [
    { 
      name: 'demandK', 
      label: 'Нахил функції попиту (k)', 
      placeholder: 'Наприклад: 1 або 2',
    },
    { 
      name: 'demandA', 
      label: 'Вільний член функції попиту (a)', 
      placeholder: 'Наприклад: 600 або 5',
    },
    { 
      name: 'supplyB', 
      label: 'Коефіцієнт при ціні в пропозиції (b)', 
      placeholder: 'Наприклад: 3 або 1',
    },
    { 
      name: 'supplyC', 
      label: 'Вільний член функції пропозиції (c)', 
      placeholder: 'Наприклад: 100 або 1',
    },
    { 
      name: 'worldPrice', 
      label: 'Світова ціна (Pw)', 
      placeholder: 'Наприклад: 210 або 2',
    },
    { 
      name: 'actualTariff', 
      label: 'Фактичне мито (T)', 
      placeholder: 'Наприклад: 15 або 0.5',
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
          {inputFields.map((field, index) => (
            <div className="input-group" key={index}>
              <label>{field.label}:</label>
              <input
                type="number"
                name={field.name}
                value={values[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                step="any"
              />
            </div>
          ))}
        </div>
        <button onClick={calculateResults}>Розрахувати</button>
        {result && (
          <div className="result">
            <h2>Результати розрахунків:</h2>
            {Object.entries(result).map(([key, value], index) => (
              <p key={index}>
                <span>{key}:</span>
                <span>{value}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;