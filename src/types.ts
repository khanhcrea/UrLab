export interface Experiment {
  id: string;
  chapter: number;
  title: string;
  subtitle: string;
  description: string;
}

export interface PendulumParams {
  length: number;      // L (meters, e.g. 0.5 to 2.5)
  gravity: number;     // g (m/s^2, e.g. 1.62 for Moon, 9.8 for Earth, 24.79 for Jupiter)
  initialAngle: number;// theta_0 (degrees, e.g. -90 to 90)
  mass: number;        // m (kg, e.g. 0.1 to 3.0)
  damping: number;     // b (air resistance coefficient, e.g. 0 to 0.5)
}

export interface WaveParams {
  amplitude: number;   // A (pixels/relative unit)
  frequency: number;   // f (Hz, e.g. 0.5 to 5.0)
  speed: number;       // v (m/s, wave propagation speed)
  damping: number;     // air / medium damping
}

export interface SpringParams {
  k: number;           // Spring constant (N/m, e.g. 10 to 80)
  mass: number;        // Mass (kg, e.g. 0.1 to 3.0)
  initialX: number;    // Initial displacement (cm, e.g. -10 to 10)
  damping: number;     // b (air resistance coefficient, e.g. 0 to 0.5)
}

export interface LightInterferenceParams {
  mode: "single" | "double";
  a: number;           // Distance between 2 slits (mm, e.g., 0.1 to 2.0)
  D: number;           // Distance from slit plane to screen (m, e.g., 0.5 to 3.0)
  lambda1: number;     // Wavelength of beam 1 (nm, e.g., 380 to 780)
  lambda2: number;     // Wavelength of beam 2 (nm, e.g., 380 to 780)
  showBeam1: boolean;  // Toggle for beam 1
  showBeam2: boolean;  // Toggle for beam 2
}

export interface SavedObservation {
  id: string;
  timestamp: string;
  experimentId: string;
  params: string;      // stringified parameters
  results: string;     // stringified calculated outputs (e.g. T, frequency)
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

