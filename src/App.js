import React, { useState } from 'react';
import './App.css';

function App() {
  const [values, setValues] = useState({
    // Функція попиту: Dd = -kPd + a
    demandK: '1',    // нахил попиту (k, наприклад, 1 або 2)
    demandA: '5',    // вільний член попиту (a, наприклад, 600 або 5)
    
    // Функція пропозиції: Sd = bPd - c
    supplyB: '2',    // коефіцієнт при ціні в пропозиції (b, наприклад, 3 або 1)
    supplyC: '0',    // вільний член пропозиції (c, наприклад, 100 або 1)
    
    worldPrice: '2', // світова ціна Pw
    actualTariff: '0.5', // фактичне мито
    tariffType: 'import', // тип мита
    worldSupplySlope: '2', // кутовий коефіцієнт світової пропозиції
    worldDemandSlope: '2', // кутовий коефіцієнт світового попиту
    importTariffRate: '0.25', // розмір ввізного мита
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const validateInputs = (k, a, b, c, Pw, T, bw, kw, t) => {
    if (isNaN(k) || isNaN(a) || isNaN(b) || isNaN(c) || isNaN(Pw) || isNaN(T) || isNaN(bw) || isNaN(kw) || isNaN(t)) {
      return "Усі поля повинні бути заповнені числовими значеннями.";
    }
    if (k <= 0) return "Нахил попиту (k) повинен бути додатним.";
    if (b <= 0) return "Коефіцієнт при ціні в пропозиції (b) повинен бути додатним.";
    if (bw <= 0) return "Кутовий коефіцієнт світової пропозиції (bw) повинен бути додатним.";
    if (kw <= 0) return "Кутовий коефіцієнт світового попиту (kw) повинен бути додатним.";
    if (t < 0) return "Розмір ввізного мита не може бути від'ємним.";
    if (k + b === 0) return "Сума нахилів (k + b) не може дорівнювати 0.";
    if (Pw < 0 || T < 0) return "Світова ціна та мито не можуть бути від'ємними.";
    return null;
  };
  
  const calculateResults = () => {
    try {
      const k = parseFloat(values.demandK);
      const a = parseFloat(values.demandA);
      const b = parseFloat(values.supplyB);
      const c = parseFloat(values.supplyC);
      const Pw = parseFloat(values.worldPrice);
      const T = parseFloat(values.actualTariff);
      const bw = parseFloat(values.worldSupplySlope);
      const kw = parseFloat(values.worldDemandSlope);
      const t = parseFloat(values.importTariffRate);
      const isImport = values.tariffType === 'import';
  
      const validationError = validateInputs(k, a, b, c, Pw, T, bw, kw, t);
      if (validationError) {
        alert(validationError);
        return;
      }
  
      const priceUnit = isImport ? 'тис. дол' : 'дол';
      const quantityUnit = isImport ? 'тис. од' : 'млн т';
  
      const domesticPrice = (a + c) / (k + b);
      if (domesticPrice <= 0) {
        alert("Автаркічна ціна не може бути від'ємною або дорівнювати нулю.");
        return;
      }
  
      const domesticDemand = -k * domesticPrice + a;
      const domesticSupply = b * domesticPrice - c;
      if (domesticDemand < 0 || domesticSupply < 0) {
        alert("Попит або пропозиція в автаркії не можуть бути від'ємними.");
        return;
      }
  
      const worldSupply = bw * Pw;
      const worldDemand = kw * Pw;
  
      let tradeDemand = Math.max(-k * Pw + a, 0);
      let tradeSupply = Math.max(b * Pw - c, 0);
  
      const tradeVolumeNoTariff = isImport 
        ? Math.max(tradeDemand - tradeSupply, 0)
        : Math.max(tradeSupply - tradeDemand, 0);
  
      const adjustedPrice = isImport ? Pw + T : Pw - T;
      if (adjustedPrice < 0) {
        alert("Ціна з урахуванням мита не може бути від'ємною.");
        return;
      }
  
      const tradeDemandWithTariff = Math.max(-k * adjustedPrice + a, 0);
      const tradeSupplyWithTariff = Math.max(b * adjustedPrice - c, 0);
  
      const tradeVolumeWithTariff = isImport 
        ? Math.max(tradeDemandWithTariff - tradeSupplyWithTariff, 0)
        : Math.max(tradeSupplyWithTariff - tradeDemandWithTariff, 0);
  
      const adjustedPriceWithRate = isImport ? Pw + (t * Pw) : Pw - (t * Pw);
      if (adjustedPriceWithRate < 0) {
        alert("Ціна з урахуванням тарифної ставки не може бути від'ємною.");
        return;
      }
  
      const tradeDemandWithRate = Math.max(-k * adjustedPriceWithRate + a, 0);
      const tradeSupplyWithRate = Math.max(b * adjustedPriceWithRate - c, 0);
  
      const tradeVolumeWithRate = isImport 
        ? Math.max(tradeDemandWithRate - tradeSupplyWithRate, 0)
        : Math.max(tradeSupplyWithRate - tradeDemandWithRate, 0);
  
      // Проміжні обчислення за зошитом
      const M = -k * (Pw + T) + a - (b * (Pw + T) - c);
      const C = 2 * M * T;
      let optimalTariff = tradeVolumeNoTariff > 0 && (2 - 4 * T) !== 0 
        ? C / (2 - 4 * T) 
        : 0;
      optimalTariff = Math.max(optimalTariff, 0); // Забезпечуємо позитивне значення
  
      const tariffAmount = t * Pw;
      const tariffDifference = Math.abs(optimalTariff - T);
  
      // Додаємо внутрішні попит і пропозиція при Pw
      const demandAtPw = Math.max(-k * Pw + a, 0);
      const supplyAtPw = Math.max(b * Pw - c, 0);
  
      setResult({
        'Внутрішня рівноважна ціна': `${domesticPrice.toFixed(2)} ${priceUnit}`,
        'Проміжне M': `${M.toFixed(2)} ${quantityUnit}`,
        'Проміжне C': `${C.toFixed(2)} ${priceUnit}`,
        'Оптимальне мито': `${optimalTariff.toFixed(2)} ${priceUnit}`,
        'Розмір ввізного мита': `${(t * 100).toFixed(1)}%`,
        'Сума ввізного мита': `${tariffAmount.toFixed(2)} ${priceUnit}`,
        'Фактичне мито': `${T.toFixed(2)} ${priceUnit}`,
        'Різниця між оптимальним і фактичним митом': `${tariffDifference.toFixed(2)} ${priceUnit}`,
        'Внутрішній попит (автаркія)': `${domesticDemand.toFixed(2)} ${quantityUnit}`,
        'Внутрішня пропозиція (автаркія)': `${domesticSupply.toFixed(2)} ${quantityUnit}`,
        'Внутрішній попит при Pw': `${demandAtPw.toFixed(2)} ${quantityUnit}`,
        'Внутрішня пропозиція при Pw': `${supplyAtPw.toFixed(2)} ${quantityUnit}`,
        'Світовий попит при Pw': `${worldDemand.toFixed(2)} ${quantityUnit}`,
        'Світова пропозиція при Pw': `${worldSupply.toFixed(2)} ${quantityUnit}`,
        [isImport ? 'Обсяг імпорту (без мита)' : 'Обсяг експорту (без мита)']: `${tradeVolumeNoTariff.toFixed(2)} ${quantityUnit}`,
        [isImport ? 'Обсяг імпорту (з митом)' : 'Обсяг експорту (з митом)']: `${tradeVolumeWithTariff.toFixed(2)} ${quantityUnit}`,
        [isImport ? 'Обсяг імпорту (з тарифною ставкою)' : 'Обсяг експорту (з тарифною ставкою)']: `${tradeVolumeWithRate.toFixed(2)} ${quantityUnit}`,
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
      formula: 'Dd = -kPd + a'
    },
    { 
      name: 'demandA', 
      label: 'Вільний член функції попиту (a)', 
      placeholder: 'Наприклад: 600 або 5',
      formula: 'Dd = -kPd + a'
    },
    { 
      name: 'supplyB', 
      label: 'Коефіцієнт при ціні в пропозиції (b)', 
      placeholder: 'Наприклад: 3 або 1',
      formula: 'Sd = bPd - c'
    },
    { 
      name: 'supplyC', 
      label: 'Вільний член функції пропозиції (c)', 
      placeholder: 'Наприклад: 100 або 1',
      formula: 'Sd = bPd - c'
    },
    { 
      name: 'worldPrice', 
      label: 'Світова ціна (Pw)', 
      placeholder: 'Наприклад: 210 або 2',
      formula: values.tariffType === 'import' ? 't* = Pd - Pw' : 't* = Pw - Pd'
    },
    { 
      name: 'worldSupplySlope', 
      label: 'Кутовий коефіцієнт світової пропозиції (bw)', 
      placeholder: 'Наприклад: 0.5 або 2',
      formula: 'Sw = bw * Pw'
    },
    { 
      name: 'worldDemandSlope', 
      label: 'Кутовий коефіцієнт світового попиту (kw)', 
      placeholder: 'Наприклад: 0.5 або 2',
      formula: 'Dw = kw * Pw'
    },
    { 
      name: 'importTariffRate', 
      label: 'Розмір ввізного мита (t)', 
      placeholder: 'Наприклад: 0.2 або 0.3',
      formula: 'T = t * Pw'
    },
    { 
      name: 'actualTariff', 
      label: 'Фактичне мито (T)', 
      placeholder: 'Наприклад: 15 або 0.5',
      formula: 'Різниця = |t* - T|'
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
              <div className="label-container">
                <label>{field.label}</label>
                <span className="formula">{field.formula}</span>
              </div>
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
