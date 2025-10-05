// Input-Management für Touch und Keyboard/Mouse
class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            left: false,
            right: false,
            middle: false
        };
        this.touch = {
            active: false,
            touches: [],
            joystick: {
                active: false,
                center: { x: 0, y: 0 },
                position: { x: 0, y: 0 },
                delta: { x: 0, y: 0 }
            }
        };
        
        this.gamepad = {
            connected: false,
            buttons: {},
            axes: {}
        };
        
        this.setupEventListeners();
        this.setupJoystick();
    }

    setupEventListeners() {
        // Keyboard Events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keys[e.key.toLowerCase()] = true;
            
            // Prevent default for game keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse Events
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('mousedown', (e) => {
            this.mouse.left = e.button === 0;
            this.mouse.right = e.button === 2;
            this.mouse.middle = e.button === 1;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
            if (e.button === 1) this.mouse.middle = false;
        });

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent right-click context menu
        });

        // Touch Events
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.active = true;
            this.updateTouches(e.touches);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.updateTouches(e.touches);
            this.updateJoystick(e.touches[0]);
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.updateTouches(e.touches);
            if (e.touches.length === 0) {
                this.touch.active = false;
                this.touch.joystick.active = false;
                this.touch.joystick.delta = { x: 0, y: 0 };
            }
        }, { passive: false });

        // Gamepad Events
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepad.connected = true;
            this.updateGamepad();
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad.id);
            this.gamepad.connected = false;
        });

        // Visibility change to pause game when tab is not active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                window.gameEvents.emit('gamePause');
            } else {
                window.gameEvents.emit('gameResume');
            }
        });
    }

    setupJoystick() {
        const joystick = document.getElementById('joystick');
        const knob = joystick.querySelector('.joystick-knob');
        
        if (!joystick || !knob) return;

        // Get joystick center position
        const rect = joystick.getBoundingClientRect();
        this.touch.joystick.center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    updateTouches(touches) {
        this.touch.touches = Array.from(touches).map(touch => ({
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY
        }));
    }

    updateJoystick(touch) {
        if (!touch) return;

        const joystick = document.getElementById('joystick');
        const knob = joystick.querySelector('.joystick-knob');
        
        if (!joystick || !knob) return;

        const rect = joystick.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        const delta = {
            x: touch.clientX - center.x,
            y: touch.clientY - center.y
        };

        const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        const maxDistance = rect.width / 2;

        if (distance <= maxDistance) {
            this.touch.joystick.active = true;
            this.touch.joystick.position = { x: touch.clientX, y: touch.clientY };
            this.touch.joystick.delta = {
                x: delta.x / maxDistance,
                y: delta.y / maxDistance
            };

            // Update visual knob position
            knob.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
        } else {
            // Clamp to joystick boundary
            const angle = Math.atan2(delta.y, delta.x);
            const clampedDelta = {
                x: Math.cos(angle) * maxDistance,
                y: Math.sin(angle) * maxDistance
            };

            this.touch.joystick.active = true;
            this.touch.joystick.position = {
                x: center.x + clampedDelta.x,
                y: center.y + clampedDelta.y
            };
            this.touch.joystick.delta = {
                x: clampedDelta.x / maxDistance,
                y: clampedDelta.y / maxDistance
            };

            knob.style.transform = `translate(${clampedDelta.x}px, ${clampedDelta.y}px)`;
        }
    }

    updateGamepad() {
        if (!this.gamepad.connected) return;

        const gamepads = navigator.getGamepads();
        if (gamepads[0]) {
            const gamepad = gamepads[0];
            
            // Update buttons
            gamepad.buttons.forEach((button, index) => {
                this.gamepad.buttons[index] = button.pressed;
            });

            // Update axes
            gamepad.axes.forEach((axis, index) => {
                this.gamepad.axes[index] = Math.abs(axis) > 0.1 ? axis : 0;
            });
        }
    }

    // Input Query Methods
    isKeyDown(key) {
        return !!this.keys[key];
    }

    isKeyPressed(key) {
        // This would need to track previous frame state for proper pressed detection
        return !!this.keys[key];
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    isMouseButtonDown(button) {
        switch (button) {
            case 'left': return this.mouse.left;
            case 'right': return this.mouse.right;
            case 'middle': return this.mouse.middle;
            default: return false;
        }
    }

    getTouchCount() {
        return this.touch.touches.length;
    }

    getTouchPosition(index = 0) {
        if (this.touch.touches[index]) {
            return {
                x: this.touch.touches[index].x,
                y: this.touch.touches[index].y
            };
        }
        return null;
    }

    getJoystickInput() {
        return {
            active: this.touch.joystick.active,
            delta: { ...this.touch.joystick.delta }
        };
    }

    getGamepadInput() {
        this.updateGamepad();
        return {
            connected: this.gamepad.connected,
            buttons: { ...this.gamepad.buttons },
            axes: { ...this.gamepad.axes }
        };
    }

    // Game-specific input methods
    getMovementInput() {
        const input = { x: 0, y: 0 };

        // Keyboard input
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) input.x -= 1;
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) input.x += 1;
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) input.y += 1;
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) input.y -= 1;

        // Touch joystick input
        if (this.touch.joystick.active) {
            input.x += this.touch.joystick.delta.x;
            input.y -= this.touch.joystick.delta.y; // Invert Y for joystick
        }

        // Gamepad input
        if (this.gamepad.connected) {
            input.x += this.gamepad.axes[0] || 0; // Left stick X
            input.y += -(this.gamepad.axes[1] || 0); // Left stick Y (inverted)
        }

        // Normalize diagonal movement
        const length = Math.sqrt(input.x * input.x + input.y * input.y);
        if (length > 1) {
            input.x /= length;
            input.y /= length;
        }

        return input;
    }

    getJumpInput() {
        return this.isKeyDown('Space') || 
               this.isKeyDown('KeyW') || 
               this.isKeyDown('ArrowUp') ||
               this.touch.joystick.active && this.touch.joystick.delta.y > 0.5 ||
               (this.gamepad.connected && this.gamepad.buttons[0]); // A button
    }

    getActionInput() {
        return this.isMouseButtonDown('left') ||
               this.isKeyDown('KeyE') ||
               this.touch.active ||
               (this.gamepad.connected && this.gamepad.buttons[1]); // B button
    }

    getPauseInput() {
        return this.isKeyDown('Escape') ||
               this.isKeyDown('KeyP') ||
               (this.gamepad.connected && this.gamepad.buttons[9]); // Start button
    }

    // Update method to be called each frame
    update() {
        this.updateGamepad();
    }

    // Reset input state
    reset() {
        this.keys = {};
        this.mouse.left = false;
        this.mouse.right = false;
        this.mouse.middle = false;
        this.touch.active = false;
        this.touch.joystick.active = false;
        this.touch.joystick.delta = { x: 0, y: 0 };
        
        // Reset joystick visual
        const knob = document.querySelector('.joystick-knob');
        if (knob) {
            knob.style.transform = 'translate(-50%, -50%)';
        }
    }
}

// Globale Input-Instanz
window.inputManager = new InputManager();
