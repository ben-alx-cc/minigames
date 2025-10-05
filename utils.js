// Utility-Funktionen für die 3D-Minigame-Webapp

class Utils {
    // Lerp (Linear Interpolation) für smooth Animationen
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Clamp-Wert zwischen min und max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Zufällige Zahl zwischen min und max
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Zufällige Ganzzahl zwischen min und max (inklusive)
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Grad zu Radiant
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Radiant zu Grad
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }

    // Distanz zwischen zwei 3D-Punkten
    static distance3D(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // Normalisierte Richtung zwischen zwei Punkten
    static direction3D(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dz = to.z - from.z;
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (length === 0) return { x: 0, y: 0, z: 0 };
        
        return {
            x: dx / length,
            y: dy / length,
            z: dz / length
        };
    }

    // Farben-Helper
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // HSL zu RGB
    static hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // Performance-Helper
    static throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    // Debounce für Input-Events
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Local Storage Helper
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
            return false;
        }
    }

    static loadFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
            return defaultValue;
        }
    }

    // Device Detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Viewport Helper
    static getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    // Animation Frame Helper
    static requestAnimationFrame(callback) {
        return window.requestAnimationFrame(callback);
    }

    static cancelAnimationFrame(id) {
        window.cancelAnimationFrame(id);
    }

    // Math Helper
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    static easeOutBounce(t) {
        if (t < (1 / 2.75)) {
            return (7.5625 * t * t);
        } else if (t < (2 / 2.75)) {
            return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
        } else if (t < (2.5 / 2.75)) {
            return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
        } else {
            return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
        }
    }

    // Vector Math
    static addVectors(v1, v2) {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y,
            z: v1.z + v2.z
        };
    }

    static subtractVectors(v1, v2) {
        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y,
            z: v1.z - v2.z
        };
    }

    static multiplyVector(v, scalar) {
        return {
            x: v.x * scalar,
            y: v.y * scalar,
            z: v.z * scalar
        };
    }

    static dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    static crossProduct(v1, v2) {
        return {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x
        };
    }

    static vectorLength(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    static normalizeVector(v) {
        const length = Utils.vectorLength(v);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length
        };
    }
}

// Event System für Kommunikation zwischen Game-Komponenten
class EventSystem {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    clear() {
        this.listeners = {};
    }
}

// Globale Event-System-Instanz
window.gameEvents = new EventSystem();
