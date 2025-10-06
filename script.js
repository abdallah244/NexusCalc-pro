// NexusCalc Pro - Ultimate Calculator with All Features Working
class NexusCalculator {
    constructor() {
        this.state = {
            displayValue: '0',
            expression: '',
            firstOperand: null,
            waitingForSecondOperand: false,
            operator: null,
            memory: 0,
            history: [],
            currentMode: 'standard',
            currentTheme: 'dark',
            currentBase: 'dec',
            settings: {
                sound: true,
                animations: true,
                scientificNotation: false,
                decimalPlaces: 6,
                angleUnit: 'deg'
            },
            converterData: {
                type: 'currency',
                rates: {
                    USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110.5,
                    CAD: 1.25, AUD: 1.35, CNY: 6.45, INR: 74.5
                }
            },
            graph: {
                functions: [],
                xMin: -10,
                xMax: 10,
                yMin: -10,
                yMax: 10
            },
            programming: {
                currentValue: 0
            }
        };
        
        this.mathParser = math;
        this.recognition = null;
        this.canvas = null;
        this.ctx = null;
        this.needsRedraw = true;
        
        this.init();
    }

    init() {
        this.loadState();
        this.setupEventListeners();
        this.createParticles();
        this.startLoadingSequence();
        this.initConverter();
        this.initGraph();
        this.setupVoiceRecognition();
    }

    startLoadingSequence() {
        let progress = 0;
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const loadingScreen = document.getElementById('loading-screen');
        const calculator = document.getElementById('calculator');

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.floor(progress)}%`;

            this.updateSystemStatus(progress);

            if (progress === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.classList.add('hidden');
                        calculator.classList.remove('hidden');
                        setTimeout(() => {
                            calculator.classList.add('loaded');
                            this.playSound('startup');
                        }, 50);
                    }, 800);
                }, 500);
            }
        }, 200);
    }

    updateSystemStatus(progress) {
        const statusItems = document.querySelectorAll('.status-item');
        if (progress >= 33) {
            statusItems[1].querySelector('span').textContent = 'AI Assistant: Online';
        }
        if (progress >= 66) {
            statusItems[2].querySelector('span').textContent = 'Graph Engine: Active';
        }
    }

    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.calc-btn.number').forEach(button => {
            button.addEventListener('click', (e) => {
                this.inputDigit(e.target.getAttribute('data-value'));
                this.animateButton(e.target);
            });
        });

        // Operator buttons
        document.querySelectorAll('.calc-btn.operator').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleOperator(e.target.getAttribute('data-action'));
                this.animateButton(e.target);
            });
        });

        // Function buttons
        document.querySelectorAll('.calc-btn.function').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleFunction(e.target.getAttribute('data-action'));
                this.animateButton(e.target);
            });
        });

        // Scientific functions
        document.querySelectorAll('.calc-btn.scientific, .calc-btn.constant, .calc-btn.function-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleScientificFunction(e.target.getAttribute('data-function'));
                this.animateButton(e.target);
            });
        });

        // Memory buttons
        document.querySelectorAll('.calc-btn.memory').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleMemory(e.target.getAttribute('data-action'));
                this.animateButton(e.target);
            });
        });

        // Programming buttons
        document.querySelectorAll('.calc-btn.programming').forEach(button => {
            button.addEventListener('click', (e) => {
                if (e.target.getAttribute('data-value')) {
                    this.inputDigit(e.target.getAttribute('data-value'));
                } else {
                    this.handleProgrammingFunction(e.target.getAttribute('data-function'));
                }
                this.animateButton(e.target);
            });
        });

        // Equals button
        document.getElementById('calculate-btn').addEventListener('click', (e) => {
            this.performCalculation();
            this.animateButton(e.target);
        });

        // Control tabs
        document.querySelectorAll('.control-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });

        // Mode indicators
        document.querySelectorAll('.mode-indicator').forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                this.switchMode(e.currentTarget.getAttribute('data-mode'));
            });
        });

        // Base selection
        document.querySelectorAll('.base-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchBase(e.currentTarget.getAttribute('data-base'));
            });
        });

        // Action buttons
        document.querySelector('.copy-btn').addEventListener('click', () => this.copyResult());
        document.querySelector('.speak-btn').addEventListener('click', () => this.speakResult());

        // Footer controls
        document.getElementById('voice-control').addEventListener('click', () => this.toggleVoiceControl());
        document.getElementById('theme-switcher').addEventListener('click', () => this.showThemeModal());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());

        // Modal controls
        document.getElementById('close-theme').addEventListener('click', () => this.hideModals());
        document.getElementById('close-settings').addEventListener('click', () => this.hideModals());
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        document.getElementById('voice-close').addEventListener('click', () => this.hideVoiceInterface());
        document.getElementById('voice-text-submit').addEventListener('click', () => this.processTextCommand());

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.changeTheme(e.currentTarget.getAttribute('data-theme'));
            });
        });

        // Settings
        this.setupSettingsListeners();

        // Converter
        this.setupConverterListeners();

        // Graphing
        this.setupGraphListeners();

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));

        // Close modals on background click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModals();
            }
            if (e.target.id === 'voice-interface') {
                this.hideVoiceInterface();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.canvas) {
                this.resizeCanvas();
            }
        });
    }

    setupSettingsListeners() {
        document.getElementById('sound-effects').addEventListener('change', (e) => {
            this.state.settings.sound = e.target.checked;
            this.saveState();
        });

        document.getElementById('animations').addEventListener('change', (e) => {
            this.state.settings.animations = e.target.checked;
            this.saveState();
        });

        document.getElementById('scientific-notation').addEventListener('change', (e) => {
            this.state.settings.scientificNotation = e.target.checked;
            this.updateDisplay();
            this.saveState();
        });

        document.getElementById('decimal-places').addEventListener('change', (e) => {
            this.state.settings.decimalPlaces = parseInt(e.target.value);
            this.updateDisplay();
            this.saveState();
        });

        document.getElementById('angle-unit').addEventListener('change', (e) => {
            this.state.settings.angleUnit = e.target.value;
            this.saveState();
        });
    }

    setupConverterListeners() {
        document.getElementById('converter-type').addEventListener('change', (e) => {
            this.state.converterData.type = e.target.value;
            this.updateConverterUnits();
            this.handleConverterInput();
        });

        document.getElementById('converter-from-value').addEventListener('input', this.debounce(() => {
            this.handleConverterInput();
        }, 300));

        document.getElementById('converter-from-unit').addEventListener('change', () => {
            this.handleConverterInput();
        });

        document.getElementById('converter-to-unit').addEventListener('change', () => {
            this.handleConverterInput();
        });

        document.getElementById('converter-swap-btn').addEventListener('click', () => {
            this.swapConverterUnits();
        });

        document.getElementById('convert-btn').addEventListener('click', () => {
            this.handleConverterInput();
        });
    }

    setupGraphListeners() {
        document.getElementById('plot-graph').addEventListener('click', () => {
            this.plotGraph();
        });

        ['graph-x-min', 'graph-x-max', 'graph-y-min', 'graph-y-max'].forEach(id => {
            document.getElementById(id).addEventListener('change', this.debounce((e) => {
                this.state.graph[id.split('-')[1]] = parseFloat(e.target.value);
                this.plotGraph();
            }, 500));
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Core Calculator Functions
    inputDigit(digit) {
        const { displayValue, waitingForSecondOperand } = this.state;

        if (this.state.currentMode === 'programmer') {
            this.handleProgrammingInput(digit);
            return;
        }

        if (waitingForSecondOperand) {
            this.state.displayValue = digit;
            this.state.waitingForSecondOperand = false;
        } else {
            this.state.displayValue = displayValue === '0' ? digit : displayValue + digit;
        }

        this.updateDisplay();
        this.playSound('click');
    }

    handleProgrammingInput(digit) {
        const currentValue = this.state.displayValue;
        
        if (currentValue === '0' || this.state.waitingForSecondOperand) {
            this.state.displayValue = digit;
            this.state.waitingForSecondOperand = false;
        } else {
            this.state.displayValue = currentValue + digit;
        }
        
        this.updateAllBaseDisplays();
        this.playSound('click');
    }

    handleOperator(nextOperator) {
        const { firstOperand, displayValue, operator } = this.state;
        const inputValue = this.getCurrentValue();

        if (operator && this.state.waitingForSecondOperand) {
            this.state.operator = nextOperator;
            this.state.expression = `${firstOperand} ${this.getOperatorSymbol(nextOperator)}`;
            this.updateDisplay();
            return;
        }

        if (firstOperand === null && !isNaN(inputValue)) {
            this.state.firstOperand = inputValue;
        } else if (operator) {
            const result = this.performCalculation();
            this.state.displayValue = this.formatNumber(result);
            this.state.firstOperand = result;
        }

        this.state.waitingForSecondOperand = true;
        this.state.operator = nextOperator;
        this.state.expression = `${this.state.firstOperand || ''} ${this.getOperatorSymbol(nextOperator)}`;
        
        this.updateDisplay();
        this.playSound('operator');
    }

    handleFunction(action) {
        switch (action) {
            case 'clear':
                this.clearCalculator();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'percentage':
                this.percentage();
                break;
            case 'mc':
                this.handleMemory('clear-memory');
                break;
            case 'mr':
                this.handleMemory('recall');
                break;
            case 'm+':
                this.handleMemory('add-to');
                break;
            case 'm-':
                this.handleMemory('subtract-from');
                break;
        }
        this.updateDisplay();
        this.playSound('function');
    }

    handleScientificFunction(func) {
        const value = this.getCurrentValue();
        let result;

        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(this.toRadians(value));
                    break;
                case 'cos':
                    result = Math.cos(this.toRadians(value));
                    break;
                case 'tan':
                    result = Math.tan(this.toRadians(value));
                    break;
                case 'sinh':
                    result = Math.sinh(value);
                    break;
                case 'cosh':
                    result = Math.cosh(value);
                    break;
                case 'tanh':
                    result = Math.tanh(value);
                    break;
                case 'log':
                    result = Math.log10(value);
                    break;
                case 'ln':
                    result = Math.log(value);
                    break;
                case 'exp':
                    result = Math.exp(value);
                    break;
                case 'sqrt':
                    result = Math.sqrt(value);
                    break;
                case 'cube-root':
                    result = Math.cbrt(value);
                    break;
                case 'power':
                    result = Math.pow(value, 2);
                    break;
                case 'cube':
                    result = Math.pow(value, 3);
                    break;
                case 'power-y':
                    this.state.firstOperand = value;
                    this.state.operator = 'power';
                    this.state.waitingForSecondOperand = true;
                    this.state.expression = `${this.formatNumber(value)}^`;
                    this.updateDisplay();
                    return;
                case 'factorial':
                    result = this.factorial(value);
                    break;
                case 'abs':
                    result = Math.abs(value);
                    break;
                case 'mod':
                    this.state.firstOperand = value;
                    this.state.operator = 'mod';
                    this.state.waitingForSecondOperand = true;
                    this.state.expression = `${this.formatNumber(value)} mod `;
                    this.updateDisplay();
                    return;
                case 'pi':
                    result = Math.PI;
                    break;
                case 'e':
                    result = Math.E;
                    break;
                case 'phi':
                    result = (1 + Math.sqrt(5)) / 2;
                    break;
                case 'derivative':
                    result = this.calculateDerivative('x^2', value); // Example
                    break;
                case 'integral':
                    result = this.calculateIntegral('x^2', 0, value); // Example
                    break;
                case 'limit':
                    result = this.calculateLimit('sin(x)/x', 0); // Example
                    break;
                default:
                    return;
            }

            this.addToHistory(`${func}(${this.formatNumber(value)})`, result);
            this.state.displayValue = this.formatNumber(result);
            this.state.waitingForSecondOperand = true;

        } catch (error) {
            this.state.displayValue = 'Error';
            this.showNotification('Math Error');
        }

        this.updateDisplay();
        this.playSound('scientific');
    }

    handleMemory(action) {
        const value = this.getCurrentValue();

        switch (action) {
            case 'store':
            case 'ms':
                this.state.memory = value;
                this.showNotification('Value stored in memory');
                break;
            case 'recall':
            case 'mr':
                this.state.displayValue = this.formatNumber(this.state.memory);
                break;
            case 'add-to':
            case 'm+':
                this.state.memory += value;
                this.showNotification('Value added to memory');
                break;
            case 'subtract-from':
            case 'm-':
                this.state.memory -= value;
                this.showNotification('Value subtracted from memory');
                break;
            case 'clear-memory':
            case 'mc':
                this.state.memory = 0;
                this.showNotification('Memory cleared');
                break;
        }

        this.updateMemoryDisplay();
        this.updateDisplay();
        this.playSound('memory');
    }

    handleProgrammingFunction(func) {
        const value = this.getCurrentValue();
        let result;

        switch (func) {
            case 'and':
                this.state.firstOperand = value;
                this.state.operator = 'and';
                this.state.waitingForSecondOperand = true;
                this.state.expression = `${this.state.displayValue} AND `;
                break;
            case 'or':
                this.state.firstOperand = value;
                this.state.operator = 'or';
                this.state.waitingForSecondOperand = true;
                this.state.expression = `${this.state.displayValue} OR `;
                break;
            case 'xor':
                this.state.firstOperand = value;
                this.state.operator = 'xor';
                this.state.waitingForSecondOperand = true;
                this.state.expression = `${this.state.displayValue} XOR `;
                break;
            case 'not':
                result = ~value;
                this.state.displayValue = this.convertFromDecimal(result);
                break;
            case 'shift-left':
                this.state.firstOperand = value;
                this.state.operator = 'shift-left';
                this.state.waitingForSecondOperand = true;
                this.state.expression = `${this.state.displayValue} << `;
                break;
            case 'shift-right':
                this.state.firstOperand = value;
                this.state.operator = 'shift-right';
                this.state.waitingForSecondOperand = true;
                this.state.expression = `${this.state.displayValue} >> `;
                break;
            default:
                return;
        }

        this.updateDisplay();
        this.updateAllBaseDisplays();
        this.playSound('programming');
    }

    performCalculation() {
        const { firstOperand, displayValue, operator } = this.state;
        const inputValue = this.getCurrentValue();

        if (operator === null || firstOperand === null) return inputValue;

        let result;

        try {
            switch (operator) {
                case 'add':
                    result = firstOperand + inputValue;
                    break;
                case 'subtract':
                    result = firstOperand - inputValue;
                    break;
                case 'multiply':
                    result = firstOperand * inputValue;
                    break;
                case 'divide':
                    if (inputValue === 0) throw new Error('Division by zero');
                    result = firstOperand / inputValue;
                    break;
                case 'power':
                    result = Math.pow(firstOperand, inputValue);
                    break;
                case 'mod':
                    result = firstOperand % inputValue;
                    break;
                case 'and':
                    result = firstOperand & inputValue;
                    break;
                case 'or':
                    result = firstOperand | inputValue;
                    break;
                case 'xor':
                    result = firstOperand ^ inputValue;
                    break;
                case 'shift-left':
                    result = firstOperand << inputValue;
                    break;
                case 'shift-right':
                    result = firstOperand >> inputValue;
                    break;
                default:
                    return inputValue;
            }

            // Add to history
            this.addToHistory(
                `${this.formatNumber(firstOperand)} ${this.getOperatorSymbol(operator)} ${this.formatNumber(inputValue)}`,
                result
            );

            this.state.displayValue = this.formatNumber(result);
            this.state.firstOperand = null;
            this.state.waitingForSecondOperand = false;
            this.state.operator = null;
            this.state.expression = '';

            this.playSound('calculate');
            return result;

        } catch (error) {
            this.state.displayValue = 'Error';
            this.showNotification(error.message);
            return 0;
        }
    }

    // Utility Functions
    getCurrentValue() {
        if (this.state.currentMode === 'programmer') {
            return this.convertToDecimal(this.state.displayValue);
        }
        return parseFloat(this.state.displayValue);
    }

    clearCalculator() {
        this.state.displayValue = '0';
        this.state.expression = '';
        this.state.firstOperand = null;
        this.state.waitingForSecondOperand = false;
        this.state.operator = null;
        this.playSound('clear');
    }

    backspace() {
        if (this.state.displayValue.length > 1) {
            this.state.displayValue = this.state.displayValue.slice(0, -1);
        } else {
            this.state.displayValue = '0';
        }
    }

    percentage() {
        this.state.displayValue = (this.getCurrentValue() / 100).toString();
    }

    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';

        if (this.state.settings.scientificNotation && (Math.abs(num) > 1e6 || Math.abs(num) < 1e-6)) {
            return num.toExponential(this.state.settings.decimalPlaces);
        }

        // Handle very small numbers
        if (Math.abs(num) < 1e-10 && num !== 0) {
            return num.toExponential(this.state.settings.decimalPlaces);
        }

        const fixed = num.toFixed(this.state.settings.decimalPlaces);
        return parseFloat(fixed).toString();
    }

    toRadians(degrees) {
        switch (this.state.settings.angleUnit) {
            case 'rad':
                return degrees;
            case 'grad':
                return degrees * (Math.PI / 200);
            default: // deg
                return degrees * (Math.PI / 180);
        }
    }

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        if (n > 100) return Infinity; // Prevent large calculations
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    getOperatorSymbol(operator) {
        const symbols = {
            'add': '+',
            'subtract': '−',
            'multiply': '×',
            'divide': '÷',
            'power': '^',
            'mod': 'mod',
            'and': 'AND',
            'or': 'OR',
            'xor': 'XOR',
            'shift-left': '<<',
            'shift-right': '>>'
        };
        return symbols[operator] || '';
    }

    // Advanced Math Functions
    calculateDerivative(func, x) {
        const h = 1e-8;
        try {
            const f = (xVal) => this.evaluateFunction(func, xVal);
            return (f(x + h) - f(x - h)) / (2 * h);
        } catch (error) {
            throw new Error('Derivative calculation failed');
        }
    }

    calculateIntegral(func, a, b) {
        const n = 1000;
        const h = (b - a) / n;
        
        try {
            const f = (xVal) => this.evaluateFunction(func, xVal);
            let sum = (f(a) + f(b)) / 2;

            for (let i = 1; i < n; i++) {
                sum += f(a + i * h);
            }

            return sum * h;
        } catch (error) {
            throw new Error('Integration failed');
        }
    }

    calculateLimit(func, approach) {
        const h = 1e-10;
        try {
            const f = (xVal) => this.evaluateFunction(func, xVal);
            return (f(approach + h) + f(approach - h)) / 2;
        } catch (error) {
            throw new Error('Limit calculation failed');
        }
    }

    evaluateFunction(funcString, x) {
        try {
            // Replace x with the value and use math.js for safe evaluation
            const expression = funcString.replace(/x/gi, `(${x})`);
            return this.mathParser.evaluate(expression);
        } catch (error) {
            throw new Error(`Invalid function: ${error.message}`);
        }
    }

    // Programming Mode Functions
    convertToDecimal(value) {
        if (this.state.currentBase === 'dec') return parseFloat(value);
        
        try {
            switch (this.state.currentBase) {
                case 'hex': return parseInt(value, 16);
                case 'oct': return parseInt(value, 8);
                case 'bin': return parseInt(value, 2);
                default: return parseFloat(value);
            }
        } catch (error) {
            return 0;
        }
    }

    convertFromDecimal(value) {
        const intValue = Math.floor(value);
        
        switch (this.state.currentBase) {
            case 'hex': return intValue.toString(16).toUpperCase();
            case 'oct': return intValue.toString(8);
            case 'bin': return intValue.toString(2);
            default: return value.toString();
        }
    }

    updateAllBaseDisplays() {
        const decimalValue = this.convertToDecimal(this.state.displayValue);
        
        document.getElementById('dec-value').textContent = decimalValue.toString();
        document.getElementById('hex-value').textContent = decimalValue.toString(16).toUpperCase();
        document.getElementById('oct-value').textContent = decimalValue.toString(8);
        document.getElementById('bin-value').textContent = decimalValue.toString(2);
    }

    // Converter Functions
    initConverter() {
        this.updateConverterUnits();
        this.handleConverterInput();
    }

    updateConverterUnits() {
        const fromUnit = document.getElementById('converter-from-unit');
        const toUnit = document.getElementById('converter-to-unit');
        
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';

        const units = this.getConverterUnits(this.state.converterData.type);
        
        units.forEach(unit => {
            const option1 = document.createElement('option');
            option1.value = unit;
            option1.textContent = unit;
            fromUnit.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = unit;
            option2.textContent = unit;
            toUnit.appendChild(option2);
        });

        // Set default values
        if (units.length >= 2) {
            fromUnit.value = units[0];
            toUnit.value = units[1];
        }
    }

    getConverterUnits(type) {
        const units = {
            currency: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'],
            length: ['m', 'km', 'cm', 'mm', 'mi', 'yd', 'ft', 'in'],
            weight: ['kg', 'g', 'mg', 'lb', 'oz'],
            temperature: ['C', 'F', 'K'],
            area: ['m²', 'km²', 'ha', 'ac', 'ft²'],
            volume: ['L', 'mL', 'm³', 'gal', 'ft³'],
            time: ['s', 'min', 'h', 'd', 'wk', 'mo', 'yr'],
            speed: ['m/s', 'km/h', 'mph', 'knot'],
            digital: ['B', 'KB', 'MB', 'GB', 'TB'],
            angle: ['deg', 'rad', 'grad']
        };

        return units[type] || units.currency;
    }

    handleConverterInput() {
        const fromValue = parseFloat(document.getElementById('converter-from-value').value) || 0;
        const fromUnit = document.getElementById('converter-from-unit').value;
        const toUnit = document.getElementById('converter-to-unit').value;
        const type = this.state.converterData.type;

        try {
            const result = this.convertValue(fromValue, fromUnit, toUnit, type);
            document.getElementById('converter-to-value').value = this.formatNumber(result);
        } catch (error) {
            document.getElementById('converter-to-value').value = 'Error';
        }
    }

    convertValue(value, fromUnit, toUnit, type) {
        if (fromUnit === toUnit) return value;

        const conversions = {
            currency: () => {
                const usdValue = value / this.state.converterData.rates[fromUnit];
                return usdValue * this.state.converterData.rates[toUnit];
            },
            length: () => {
                const toMeter = {
                    m: 1, km: 1000, cm: 0.01, mm: 0.001,
                    mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254
                };
                return value * toMeter[fromUnit] / toMeter[toUnit];
            },
            temperature: () => {
                const toCelsius = {
                    C: (c) => c,
                    F: (f) => (f - 32) * 5/9,
                    K: (k) => k - 273.15
                };
                const toTarget = {
                    C: (c) => c,
                    F: (c) => c * 9/5 + 32,
                    K: (c) => c + 273.15
                };
                const celsius = toCelsius[fromUnit](value);
                return toTarget[toUnit](celsius);
            },
            weight: () => {
                const toKg = {
                    kg: 1, g: 0.001, mg: 0.000001,
                    lb: 0.453592, oz: 0.0283495
                };
                return value * toKg[fromUnit] / toKg[toUnit];
            },
            area: () => {
                const toSqMeter = {
                    'm²': 1, 'km²': 1000000, ha: 10000, ac: 4046.86, 'ft²': 0.092903
                };
                return value * toSqMeter[fromUnit] / toSqMeter[toUnit];
            },
            volume: () => {
                const toLiter = {
                    L: 1, mL: 0.001, 'm³': 1000, gal: 3.78541, 'ft³': 28.3168
                };
                return value * toLiter[fromUnit] / toLiter[toUnit];
            },
            time: () => {
                const toSecond = {
                    s: 1, min: 60, h: 3600, d: 86400, wk: 604800, mo: 2592000, yr: 31536000
                };
                return value * toSecond[fromUnit] / toSecond[toUnit];
            },
            speed: () => {
                const toMeterPerSecond = {
                    'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444
                };
                return value * toMeterPerSecond[fromUnit] / toMeterPerSecond[toUnit];
            },
            digital: () => {
                const toByte = {
                    B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776
                };
                return value * toByte[fromUnit] / toByte[toUnit];
            },
            angle: () => {
                const toDegree = {
                    deg: 1, rad: 57.2958, grad: 0.9
                };
                return value * toDegree[fromUnit] / toDegree[toUnit];
            }
        };

        return conversions[type] ? conversions[type]() : value;
    }

    swapConverterUnits() {
        const fromUnit = document.getElementById('converter-from-unit');
        const toUnit = document.getElementById('converter-to-unit');
        const temp = fromUnit.value;
        fromUnit.value = toUnit.value;
        toUnit.value = temp;
        this.handleConverterInput();
    }

    // Graphing Functions
    initGraph() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.needsRedraw = true;
        this.plotGraph();
    }

    plotGraph() {
        if (!this.canvas || !this.ctx) return;

        const functionInput = document.getElementById('graph-function').value;
        if (!functionInput) {
            this.drawGrid();
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        
        try {
            this.plotFunction(functionInput);
        } catch (error) {
            this.showNotification('Error plotting function: ' + error.message);
        }
    }

    drawGrid() {
        const { width, height } = this.canvas;
        const { xMin, xMax, yMin, yMax } = this.state.graph;

        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted');
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = Math.ceil(xMin); x <= xMax; x++) {
            const pixelX = this.xToPixel(x);
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, 0);
            this.ctx.lineTo(pixelX, height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = Math.ceil(yMin); y <= yMax; y++) {
            const pixelY = this.yToPixel(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(width, pixelY);
            this.ctx.stroke();
        }

        // Axes
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        this.ctx.lineWidth = 2;

        // X-axis
        if (yMin <= 0 && yMax >= 0) {
            const yZero = this.yToPixel(0);
            this.ctx.beginPath();
            this.ctx.moveTo(0, yZero);
            this.ctx.lineTo(width, yZero);
            this.ctx.stroke();
        }

        // Y-axis
        if (xMin <= 0 && xMax >= 0) {
            const xZero = this.xToPixel(0);
            this.ctx.beginPath();
            this.ctx.moveTo(xZero, 0);
            this.ctx.lineTo(xZero, height);
            this.ctx.stroke();
        }
    }

    plotFunction(funcString) {
        const { width, height } = this.canvas;
        const { xMin, xMax } = this.state.graph;
        const step = (xMax - xMin) / width;

        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        let firstPoint = true;

        for (let pixelX = 0; pixelX < width; pixelX++) {
            const x = xMin + (pixelX / width) * (xMax - xMin);
            
            try {
                const y = this.evaluateFunction(funcString, x);
                
                if (isFinite(y)) {
                    const pixelY = this.yToPixel(y);
                    
                    if (pixelY >= 0 && pixelY <= height) {
                        if (firstPoint) {
                            this.ctx.moveTo(pixelX, pixelY);
                            firstPoint = false;
                        } else {
                            this.ctx.lineTo(pixelX, pixelY);
                        }
                    } else {
                        firstPoint = true;
                    }
                } else {
                    firstPoint = true;
                }
            } catch (error) {
                firstPoint = true;
            }
        }

        this.ctx.stroke();
    }

    xToPixel(x) {
        const { width } = this.canvas;
        const { xMin, xMax } = this.state.graph;
        return ((x - xMin) / (xMax - xMin)) * width;
    }

    yToPixel(y) {
        const { height } = this.canvas;
        const { yMin, yMax } = this.state.graph;
        return height - ((y - yMin) / (yMax - yMin)) * height;
    }

    // UI Control Functions
    switchTab(tabName) {
        document.querySelectorAll('.control-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.playSound('tab');
    }

    switchMode(mode) {
        this.state.currentMode = mode;
        
        document.querySelectorAll('.mode-indicator').forEach(indicator => {
            indicator.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        document.querySelectorAll('.graphing-panel, .programmer-panel').forEach(panel => {
            panel.classList.add('hidden');
        });

        if (mode === 'graphing') {
            document.getElementById('graphing-panel').classList.remove('hidden');
            this.resizeCanvas();
        } else if (mode === 'programmer') {
            document.getElementById('programmer-panel').classList.remove('hidden');
            this.updateAllBaseDisplays();
        }

        this.playSound('mode');
        this.saveState();
    }

    switchBase(base) {
        this.state.currentBase = base;
        
        document.querySelectorAll('.base-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-base="${base}"]`).classList.add('active');

        document.querySelectorAll('.base-value').forEach(display => {
            display.classList.add('hidden');
        });
        document.getElementById(`${base}-value`).classList.remove('hidden');

        this.updateAllBaseDisplays();
        this.playSound('base');
    }

    changeTheme(theme) {
        this.state.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');

        this.hideModals();
        this.playSound('theme');
        this.saveState();
    }

    showThemeModal() {
        document.getElementById('theme-modal').classList.add('active');
        this.playSound('modal');
    }

    showSettingsModal() {
        document.getElementById('sound-effects').checked = this.state.settings.sound;
        document.getElementById('animations').checked = this.state.settings.animations;
        document.getElementById('scientific-notation').checked = this.state.settings.scientificNotation;
        document.getElementById('decimal-places').value = this.state.settings.decimalPlaces;
        document.getElementById('angle-unit').value = this.state.settings.angleUnit;

        document.getElementById('settings-modal').classList.add('active');
        this.playSound('modal');
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Voice Control Functions
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                document.querySelector('.voice-status').textContent = 'Listening...';
            };

            this.recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase();
                this.processVoiceCommand(command);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.showNotification('Voice recognition failed. Please try again.');
                this.showVoiceFallback();
            };

            this.recognition.onend = () => {
                this.hideVoiceInterface();
            };
        } else {
            this.showNotification('Voice recognition not supported in this browser');
        }
    }

    toggleVoiceControl() {
        if (!this.recognition) {
            this.showNotification('Voice recognition not available');
            this.showVoiceFallback();
            return;
        }

        document.getElementById('voice-interface').classList.remove('hidden');
        try {
            this.recognition.start();
        } catch (error) {
            this.showNotification('Voice recognition error. Using text input.');
            this.showVoiceFallback();
        }
    }

    showVoiceFallback() {
        document.getElementById('voice-fallback').classList.remove('hidden');
        document.querySelector('.voice-status').textContent = 'Type your command:';
    }

    hideVoiceInterface() {
        document.getElementById('voice-interface').classList.add('hidden');
        document.getElementById('voice-fallback').classList.add('hidden');
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    processVoiceCommand(command) {
        this.showNotification(`Heard: "${command}"`);
        
        const commands = {
            'clear': () => this.clearCalculator(),
            'reset': () => this.clearCalculator(),
            'add': () => this.handleOperator('add'),
            'plus': () => this.handleOperator('add'),
            'subtract': () => this.handleOperator('subtract'),
            'minus': () => this.handleOperator('subtract'),
            'multiply': () => this.handleOperator('multiply'),
            'times': () => this.handleOperator('multiply'),
            'divide': () => this.handleOperator('divide'),
            'over': () => this.handleOperator('divide'),
            'equals': () => this.performCalculation(),
            'equal': () => this.performCalculation(),
            'percentage': () => this.percentage(),
            'percent': () => this.percentage(),
            'square root': () => this.handleScientificFunction('sqrt'),
            'squared': () => this.handleScientificFunction('power'),
            'cubed': () => this.handleScientificFunction('cube'),
            'sin': () => this.handleScientificFunction('sin'),
            'cos': () => this.handleScientificFunction('cos'),
            'tan': () => this.handleScientificFunction('tan')
        };

        for (const [key, action] of Object.entries(commands)) {
            if (command.includes(key)) {
                action();
                return;
            }
        }

        // Try to parse mathematical expression
        this.parseVoiceExpression(command);
    }

    processTextCommand() {
        const textInput = document.getElementById('voice-text-input').value;
        if (textInput.trim()) {
            this.processVoiceCommand(textInput);
            document.getElementById('voice-text-input').value = '';
        }
        this.hideVoiceInterface();
    }

    parseVoiceExpression(command) {
        try {
            const expression = command
                .replace(/plus/gi, '+')
                .replace(/add/gi, '+')
                .replace(/minus/gi, '-')
                .replace(/subtract/gi, '-')
                .replace(/times/gi, '*')
                .replace(/multiply/gi, '*')
                .replace(/divide/gi, '/')
                .replace(/over/gi, '/')
                .replace(/x/gi, '*')
                .replace(/to the power/gi, '^')
                .replace(/squared/gi, '^2')
                .replace(/cubed/gi, '^3')
                .replace(/square root/gi, 'sqrt')
                .replace(/cube root/gi, 'cbrt')
                .replace(/pi/gi, 'pi')
                .replace(/e/gi, 'e')
                .replace(/point/gi, '.')
                .replace(/zero/gi, '0')
                .replace(/one/gi, '1')
                .replace(/two/gi, '2')
                .replace(/three/gi, '3')
                .replace(/four/gi, '4')
                .replace(/five/gi, '5')
                .replace(/six/gi, '6')
                .replace(/seven/gi, '7')
                .replace(/eight/gi, '8')
                .replace(/nine/gi, '9');

            const result = this.mathParser.evaluate(expression);
            this.state.displayValue = this.formatNumber(result);
            this.updateDisplay();
            this.addToHistory(`Voice: ${command}`, result);
            this.showNotification('Calculation completed');
        } catch (error) {
            this.showNotification('Could not understand the command');
        }
    }

    // Additional Features
    copyResult() {
        navigator.clipboard.writeText(this.state.displayValue).then(() => {
            this.showNotification('Result copied to clipboard!');
            this.playSound('copy');
        }).catch(() => {
            this.showNotification('Failed to copy result');
        });
    }

    async speakResult() {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(this.state.displayValue);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
            this.playSound('speak');
        } else {
            this.showNotification('Text-to-speech not supported');
        }
    }

    showHelp() {
        this.showNotification('Check the documentation for detailed help! Basic commands: say numbers and operations like "5 plus 3"');
        this.playSound('help');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    animateButton(button) {
        if (!this.state.settings.animations) return;

        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    playSound(type) {
        if (!this.state.settings.sound) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const frequencies = {
            'click': 800, 'operator': 600, 'function': 400, 'scientific': 1000,
            'memory': 300, 'calculate': 1200, 'clear': 200, 'tab': 500,
            'mode': 700, 'theme': 900, 'modal': 1100, 'copy': 1300,
            'speak': 1500, 'help': 1700, 'base': 1900, 'programming': 500,
            'startup': [200, 400, 600, 800, 1000, 1200]
        };

        const frequency = frequencies[type];
        
        if (Array.isArray(frequency)) {
            frequency.forEach((freq, index) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    
                    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    osc.start(audioContext.currentTime);
                    osc.stop(audioContext.currentTime + 0.3);
                }, index * 100);
            });
        } else {
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }

    // History Functions
    addToHistory(expression, result) {
        this.state.history.unshift({
            expression,
            result: this.formatNumber(result),
            timestamp: new Date().toLocaleTimeString()
        });

        if (this.state.history.length > 50) {
            this.state.history.pop();
        }

        this.updateHistoryDisplay();
        this.saveState();
    }

    clearHistory() {
        this.state.history = [];
        this.updateHistoryDisplay();
        this.saveState();
        this.showNotification('History cleared');
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        this.state.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.expression} =</div>
                <div class="history-result">${item.result}</div>
            `;
            historyList.appendChild(historyItem);
        });
    }

    // Display Functions
    updateDisplay() {
        document.getElementById('result').textContent = this.state.displayValue;
        document.getElementById('expression').textContent = this.state.expression;
    }

    updateMemoryDisplay() {
        document.getElementById('memory-value').textContent = this.formatNumber(this.state.memory);
    }

    // Keyboard Support
    handleKeyboardInput(event) {
        const { key } = event;

        if (/[0-9+\-*/.=]|Enter|Escape|Backspace|%/.test(key)) {
            event.preventDefault();
        }

        if (/[0-9]/.test(key)) {
            this.inputDigit(key);
        } else if (key === '.') {
            this.inputDigit('.');
        } else if (key === '+') {
            this.handleOperator('add');
        } else if (key === '-') {
            this.handleOperator('subtract');
        } else if (key === '*' || key === 'x') {
            this.handleOperator('multiply');
        } else if (key === '/') {
            this.handleOperator('divide');
        } else if (key === 'Enter' || key === '=') {
            this.performCalculation();
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            this.clearCalculator();
        } else if (key === 'Backspace') {
            this.backspace();
        } else if (key === '%') {
            this.percentage();
        } else if (key === 'm' || key === 'M') {
            this.handleMemory('store');
        }
    }

    // Background Effects
    createParticles() {
        const container = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 3 + 1;
            const left = Math.random() * 100;
            const animationDelay = Math.random() * 20;
            const animationDuration = Math.random() * 10 + 10;
            const opacity = Math.random() * 0.5 + 0.1;

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${left}%;
                animation-delay: ${animationDelay}s;
                animation-duration: ${animationDuration}s;
                opacity: ${opacity};
            `;

            container.appendChild(particle);
        }
    }

    // Data Persistence
    saveState() {
        try {
            localStorage.setItem('nexusCalcState', JSON.stringify(this.state));
        } catch (error) {
            console.warn('Could not save state to localStorage');
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('nexusCalcState');
            if (saved) {
                const savedState = JSON.parse(saved);
                this.state = { ...this.state, ...savedState };
                this.applySavedState();
            }
        } catch (error) {
            console.warn('Could not load state from localStorage');
        }
    }

    applySavedState() {
        if (this.state.currentTheme) {
            document.documentElement.setAttribute('data-theme', this.state.currentTheme);
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
            });
            const currentThemeOption = document.querySelector(`[data-theme="${this.state.currentTheme}"]`);
            if (currentThemeOption) {
                currentThemeOption.classList.add('active');
            }
        }

        if (this.state.currentMode) {
            this.switchMode(this.state.currentMode);
        }

        if (this.state.currentBase) {
            this.switchBase(this.state.currentBase);
        }

        this.updateDisplay();
        this.updateMemoryDisplay();
        this.updateHistoryDisplay();
        this.updateConverterUnits();
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NexusCalculator();
});