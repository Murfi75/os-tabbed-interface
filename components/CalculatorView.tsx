
import React, { useState, useCallback, useMemo } from 'react';
import { CalculatorOperation } from '../types';

const CalculatorView: React.FC = () => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalculatorOperation | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);

  const isErrorState = useMemo(() => displayValue === 'Error', [displayValue]);

  const handleDigitClick = useCallback((digit: string) => {
    if (isErrorState) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false); // Start fresh after error
      return;
    }
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      // Prevent multiple leading zeros, unless it's "0."
      if (displayValue === '0' && digit === '0' && !displayValue.includes('.')) return;
      // If current value is '0' and a non-zero digit is pressed, replace '0'
      if (displayValue === '0' && digit !== '0' && !displayValue.includes('.')) {
        setDisplayValue(digit);
      } else {
        // Limit display length to prevent overflow, e.g., 15 chars
        if (displayValue.length < 15) {
            setDisplayValue(displayValue + digit);
        }
      }
    }
  }, [displayValue, waitingForSecondOperand, isErrorState]);

  const handleDecimalClick = useCallback(() => {
    if (isErrorState) {
      setDisplayValue('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (waitingForSecondOperand) {
      setDisplayValue('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  }, [displayValue, waitingForSecondOperand, isErrorState]);

  const performCalculation = useCallback((
    op1: number,
    op2: number,
    currentOperator: CalculatorOperation
  ): number => {
    switch (currentOperator) {
      case CalculatorOperation.ADD:
        return op1 + op2;
      case CalculatorOperation.SUBTRACT:
        return op1 - op2;
      case CalculatorOperation.MULTIPLY:
        return op1 * op2;
      case CalculatorOperation.DIVIDE:
        return op2 === 0 ? NaN : op1 / op2;
      default:
        return op2; 
    }
  }, []);

  const formatResult = (num: number): string => {
    if (isNaN(num) || !isFinite(num)) return 'Error';
    const resultStr = String(num);
    if (resultStr.length > 15) { // Check if precision formatting is needed
        if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-7 && num !== 0) ) {
            return num.toExponential(9); // Use exponential for very large/small
        }
        // For other long numbers, try toFixed if it has many decimals
        const decimalPart = resultStr.split('.')[1];
        if (decimalPart && decimalPart.length > 7) {
            return parseFloat(num.toFixed(7)).toString(); // Limit decimals and remove trailing zeros
        }
    }
    return parseFloat(num.toFixed(10)).toString(); // Default precision and remove trailing zeros for most numbers
  };


  const handleOperatorClick = useCallback((nextOperator: CalculatorOperation) => {
    if (isErrorState) return;
    const inputValue = parseFloat(displayValue);
    if (isNaN(inputValue)) return; // Should not happen if not error state

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = performCalculation(firstOperand, inputValue, operator);
      const formattedResult = formatResult(result);
      setDisplayValue(formattedResult);
      setFirstOperand(formattedResult === 'Error' ? null : result);
      if (formattedResult === 'Error') {
        setOperator(null);
        setWaitingForSecondOperand(true); // Allow reset on next digit
        return;
      }
    }
    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  }, [displayValue, firstOperand, operator, performCalculation, isErrorState, formatResult]);

  const handleEqualsClick = useCallback(() => {
    if (isErrorState || operator === null || firstOperand === null || waitingForSecondOperand) return;
    
    const inputValue = parseFloat(displayValue);
    if (isNaN(inputValue)) {
        setDisplayValue('Error');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(true);
        return;
    }

    const result = performCalculation(firstOperand, inputValue, operator);
    const formattedResult = formatResult(result);
    setDisplayValue(formattedResult);
    setFirstOperand(null); 
    setOperator(null);
    // waitingForSecondOperand remains true by default from operator click, 
    // but if user hits equals, then types a number, it should start fresh.
    // So, explicitly set it true.
    setWaitingForSecondOperand(true); 
  }, [displayValue, firstOperand, operator, waitingForSecondOperand, performCalculation, isErrorState, formatResult]);

  const handleClearClick = useCallback(() => { // AC - All Clear
    setDisplayValue('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  }, []);
  
  const handleSignChangeClick = useCallback(() => {
    if (isErrorState) return;
    if (displayValue === '0' || displayValue === '0.') return; // Don't change sign of zero
    setDisplayValue(prev => String(parseFloat(prev) * -1));
  }, [isErrorState, displayValue]);

  const handlePercentageClick = useCallback(() => {
    if (isErrorState) return;
    const currentValue = parseFloat(displayValue);
    if (isNaN(currentValue)) return;

    if (firstOperand !== null && operator) {
        // Calculate percentage of the first operand
        const percentageOfFirst = (firstOperand * currentValue) / 100;
        setDisplayValue(formatResult(percentageOfFirst));
        // The result of percentage usually becomes the second operand for ongoing calculation
        // e.g. 100 + 10% (of 100) = 110. So, 10 becomes the current display value.
        // The user might then press equals or another operator.
        // Let's keep waitingForSecondOperand as false for this.
        setWaitingForSecondOperand(false);
    } else {
        // If no prior operation, calculate n/100
        setDisplayValue(formatResult(currentValue / 100));
        setWaitingForSecondOperand(true); // Result of standalone percent, next digit starts new number
    }
  }, [isErrorState, displayValue, firstOperand, operator, formatResult]);

  // --- New Functions ---
  const handleMemoryClear = useCallback(() => {
    if (isErrorState && displayValue !== '0') return; // Don't allow memory ops on hard error
    setMemory(0);
  }, [isErrorState, displayValue]);

  const handleMemoryRecall = useCallback(() => {
    if (isErrorState && displayValue !== '0') return;
    setDisplayValue(String(memory));
    setWaitingForSecondOperand(true); // After MR, next digit starts new number
  }, [memory, isErrorState, displayValue]);

  const handleMemoryAdd = useCallback(() => {
    if (isErrorState) return;
    const currentValue = parseFloat(displayValue);
    if (!isNaN(currentValue)) {
      setMemory(prevMemory => prevMemory + currentValue);
    }
    setWaitingForSecondOperand(true); // Ready for next number or operation
  }, [displayValue, isErrorState]);

  const handleMemorySubtract = useCallback(() => {
    if (isErrorState) return;
    const currentValue = parseFloat(displayValue);
    if (!isNaN(currentValue)) {
      setMemory(prevMemory => prevMemory - currentValue);
    }
    setWaitingForSecondOperand(true); // Ready for next number or operation
  }, [displayValue, isErrorState]);

  const handleBackspace = useCallback(() => {
    if (isErrorState) {
      handleClearClick(); // Clear error with backspace
      return;
    }
    if (waitingForSecondOperand) return; // Don't backspace if waiting for new number
    
    setDisplayValue(prev => {
      if (prev.length === 1 || (prev.length === 2 && prev.startsWith('-'))) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  }, [isErrorState, waitingForSecondOperand, handleClearClick]);

  const handleSquareRoot = useCallback(() => {
    if (isErrorState) return;
    const currentValue = parseFloat(displayValue);
    if (currentValue < 0) {
      setDisplayValue('Error');
    } else {
      setDisplayValue(formatResult(Math.sqrt(currentValue)));
    }
    setWaitingForSecondOperand(true);
  }, [displayValue, isErrorState, formatResult]);

  const handleSquare = useCallback(() => {
    if (isErrorState) return;
    const currentValue = parseFloat(displayValue);
    setDisplayValue(formatResult(Math.pow(currentValue, 2)));
    setWaitingForSecondOperand(true);
  }, [displayValue, isErrorState, formatResult]);

  const handleReciprocal = useCallback(() => { // 1/x
    if (isErrorState) return;
    const currentValue = parseFloat(displayValue);
    if (currentValue === 0) {
      setDisplayValue('Error');
    } else {
      setDisplayValue(formatResult(1 / currentValue));
    }
    setWaitingForSecondOperand(true);
  }, [displayValue, isErrorState, formatResult]);

  const buttons = [
    // Row 1: Memory functions
    { label: 'MC', handler: handleMemoryClear, className: 'bg-slate-500 hover:bg-slate-400' },
    { label: 'MR', handler: handleMemoryRecall, className: 'bg-slate-500 hover:bg-slate-400' },
    { label: 'M+', handler: handleMemoryAdd, className: 'bg-slate-500 hover:bg-slate-400' },
    { label: 'M-', handler: handleMemorySubtract, className: 'bg-slate-500 hover:bg-slate-400' },
    // Row 2: Control and basic unary
    { label: '←', handler: handleBackspace, className: 'bg-slate-500 hover:bg-slate-400' }, // Backspace
    { label: 'AC', handler: handleClearClick, className: 'bg-slate-500 hover:bg-slate-400' }, // All Clear
    { label: '+/-', handler: handleSignChangeClick, className: 'bg-slate-500 hover:bg-slate-400' },
    { label: '%', handler: handlePercentageClick, className: 'bg-slate-500 hover:bg-slate-400' },
    // Row 3: Advanced unary and divide
    { label: '1/x', handler: handleReciprocal, className: 'bg-slate-500 hover:bg-slate-400' },
    { label: 'x²', handler: handleSquare, className: 'bg-slate-500 hover:bg-slate-400' },
    { label: '√', handler: handleSquareRoot, className: 'bg-slate-500 hover:bg-slate-400' },
    { label: '÷', handler: () => handleOperatorClick(CalculatorOperation.DIVIDE), className: 'bg-orange-500 hover:bg-orange-400' },
    // Row 4: Numbers and multiply
    { label: '7', handler: () => handleDigitClick('7') },
    { label: '8', handler: () => handleDigitClick('8') },
    { label: '9', handler: () => handleDigitClick('9') },
    { label: '×', handler: () => handleOperatorClick(CalculatorOperation.MULTIPLY), className: 'bg-orange-500 hover:bg-orange-400' },
    // Row 5: Numbers and subtract
    { label: '4', handler: () => handleDigitClick('4') },
    { label: '5', handler: () => handleDigitClick('5') },
    { label: '6', handler: () => handleDigitClick('6') },
    { label: '-', handler: () => handleOperatorClick(CalculatorOperation.SUBTRACT), className: 'bg-orange-500 hover:bg-orange-400' },
    // Row 6: Numbers and add
    { label: '1', handler: () => handleDigitClick('1') },
    { label: '2', handler: () => handleDigitClick('2') },
    { label: '3', handler: () => handleDigitClick('3') },
    { label: '+', handler: () => handleOperatorClick(CalculatorOperation.ADD), className: 'bg-orange-500 hover:bg-orange-400' },
    // Row 7: Zero, decimal, equals
    { label: '0', handler: () => handleDigitClick('0'), className: 'col-span-2' },
    { label: '.', handler: handleDecimalClick },
    { label: '=', handler: handleEqualsClick, className: 'bg-orange-500 hover:bg-orange-400' },
  ];

  return (
    <div className="w-full max-w-xs mx-auto p-3 sm:p-4 bg-slate-700 rounded-lg shadow-md">
      <div className="relative bg-slate-800 text-white text-3xl sm:text-4xl text-right p-4 mb-4 rounded break-all h-20 flex items-end justify-end">
        {memory !== 0 && <span className="absolute top-1 left-2 text-xs text-sky-400 opacity-75" aria-hidden="true">M</span>}
        <span className="truncate">{displayValue}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.handler}
            disabled={isErrorState && !['AC', '←'].includes(btn.label) && !(btn.label.match(/[0-9]/) && btn.label.length === 1) && btn.label !== '.'} // Disable most buttons on error
            className={`
              p-3 sm:p-4 text-base sm:text-xl rounded 
              ${btn.className ? btn.className : 'bg-slate-600 hover:bg-slate-500'}
              text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label={btn.label === '←' ? 'Backspace' : btn.label === 'AC' ? 'All Clear' : btn.label === '+/-' ? 'Toggle Sign' : btn.label === '√' ? 'Square Root' : btn.label === 'x²' ? 'Square' : btn.label === '1/x' ? 'Reciprocal' : btn.label}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalculatorView;
