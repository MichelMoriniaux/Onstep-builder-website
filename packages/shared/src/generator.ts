// JTW mount configuration generator — derived from the wizard in
// MichelMoriniaux/JTW-Trident-Mounts/generator/generator.py, extended with
// per-axis reversal, PID, PEC and homing options, and firmware-version targeting.
//
// Targets JTW Trident / P75 mounts on the Manticore controller specifically.

export type MountModel = "GTR" | "P75";

/** Firmware version the templates + source refs are pinned to. */
export type MountVersion = "10.25p" | "10.28u";

export interface VersionRefs {
  onstepx: string;
  plugins: string;
  sws: string;
}

/** Source commits per firmware version. Templates live in templates/<version>/. */
export const VERSIONS: Record<MountVersion, VersionRefs> = {
  "10.25p": { onstepx: "cecb810", plugins: "52a31e7", sws: "8ff13c3" },
  "10.28u": { onstepx: "89c9ca4", plugins: "dfa9d91", sws: "193a818" },
};

export const VERSION_LIST: MountVersion[] = ["10.28u", "10.25p"];
export const DEFAULT_VERSION: MountVersion = "10.28u";

export interface GeneratorAnswers {
  version: MountVersion;
  model: MountModel;
  compensation: string;
  encoder: string; // OFF | JTW_24BIT | JTW_26BIT | AS37_H39B_B

  // Reversal (per axis)
  axis1_reverse: string; // OFF | ON  (motor / movement direction)
  axis2_reverse: string;
  axis1_encoder_reverse: string; // OFF | ON
  axis2_encoder_reverse: string;

  // Servo PID (6 per axis)
  axis1_pid_p: string;
  axis1_pid_i: string;
  axis1_pid_d: string;
  axis1_pid_p_goto: string;
  axis1_pid_i_goto: string;
  axis1_pid_d_goto: string;
  axis2_pid_p: string;
  axis2_pid_i: string;
  axis2_pid_d: string;
  axis2_pid_p_goto: string;
  axis2_pid_i_goto: string;
  axis2_pid_d_goto: string;

  // PEC
  pec_spwr: string; // steps per worm rotation, "0" disables
  pec_sense: string; // OFF | HIGH | LOW | LOW|THLD(360)|HYST(120)

  // Homing
  home_sense: string; // OFF | HIGH | LOW
  home_switch: string; // OFF | ON (SWS display of home switch reversal)
  home_range: string; // arcsec

  // Wi-Fi
  wifi_mode: string; // WIFI_ACCESS_POINT | WIFI_STATION | OFF | BLUETOOTH
  ap_ssid: string;
  ap_password: string;
  ap_wifi_ip: string;
  ap_wifi_mask: string;
  sta_ssid: string;
  sta_password: string;
  wifi_dhcp: string; // "true" | "false"
  sta_wifi_ip: string;
  sta_wifi_mask: string;
  sta_wifi_gw: string;

  // Ethernet / clock / weather
  eth_dhcp: string; // "true" | "false"
  eth_ip: string;
  eth_mask: string;
  eth_gw: string;
  weather_mode: string; // OFF | BME280_0x76
  tls: string; // DS3231 | NTP | GPS
  pps: string; // OFF | ON
  pps_detect: string; // OFF | HIGH | LOW | BOTH
}

/** Full substitution map (every template placeholder). */
export type GeneratorConfig = Record<string, string>;

export interface GeneratedFiles {
  onstepx: { "Config.h": string };
  sws: { "Config.h": string; "Extended.config.h": string };
}

export interface GenOption {
  value: string;
  label: string;
  help?: string;
  models?: MountModel[];
}

// ---- option lists -----------------------------------------------------------

export const GEN_OPTIONS = {
  version: [
    { value: "10.28u", label: "10.28u", help: "OnStepX 10.28u." },
    { value: "10.25p", label: "10.25p", help: "OnStepX 10.25p." },
  ] as GenOption[],
  model: [
    { value: "GTR", label: "GTR", help: "Second-generation Trident; usually homing + PEC sensors, optional encoders." },
    { value: "P75", label: "P75", help: "First-generation Trident; can be configured with encoders." },
  ] as GenOption[],
  compensation: [
    { value: "OFF", label: "None" },
    { value: "REFRACTION", label: "RA refraction", help: "Works best with a TPH probe." },
    { value: "REFRACTION_DUAL", label: "Refraction, both axes", help: "Works best with a TPH probe." },
    { value: "MODEL", label: "RA pointing-model" },
    { value: "MODEL_DUAL", label: "Pointing-model, both axes" },
  ] as GenOption[],
  encoder: [
    { value: "OFF", label: "No encoders" },
    { value: "JTW_24BIT", label: "24-bit (GTR, P75)" },
    { value: "JTW_26BIT", label: "26-bit (GTR)", models: ["GTR"] },
    { value: "AS37_H39B_B", label: "23-bit (P75)", models: ["P75"] },
  ] as GenOption[],
  wifi_mode: [
    { value: "WIFI_ACCESS_POINT", label: "Access point", help: "Controller is its own Wi-Fi AP; no internet (no NTP)." },
    { value: "WIFI_STATION", label: "Join my network", help: "Controller joins your Wi-Fi and reaches the internet." },
    { value: "OFF", label: "Off (Ethernet/USB)", help: "Disables Wi-Fi. Remember to remove the 'webserver' plugin." },
    { value: "BLUETOOTH", label: "Bluetooth (gamepad)", help: "Disables Wi-Fi, enables Bluetooth." },
  ] as GenOption[],
  weather_mode: [
    { value: "OFF", label: "No TPH probe" },
    { value: "BME280_0x76", label: "BME680/280 on AUX (I²C)", help: "JTW I²C temperature/pressure/humidity probe on the AUX port." },
  ] as GenOption[],
  tls: [
    { value: "DS3231", label: "Onboard RTC (DS3231)", help: "Preferred." },
    { value: "NTP", label: "NTP server", help: "Requires 'Join my network' Wi-Fi; uses time-a-g.nist.gov." },
    { value: "GPS", label: "GPS dongle on AUX", help: "Not recommended — slow fix can time out." },
  ] as GenOption[],
  pps: [
    { value: "OFF", label: "No" },
    { value: "ON", label: "Yes" },
  ] as GenOption[],
  pps_detect: [
    { value: "OFF", label: "Off" },
    { value: "HIGH", label: "Rising edge" },
    { value: "LOW", label: "Falling edge" },
    { value: "BOTH", label: "Both edges" },
  ] as GenOption[],
  onOff: [
    { value: "OFF", label: "Off" },
    { value: "ON", label: "On" },
  ] as GenOption[],
  pec_sense: [
    { value: "OFF", label: "No PEC sensor" },
    { value: "HIGH", label: "Rising edge (HIGH)" },
    { value: "LOW", label: "Falling edge (LOW)" },
    { value: "LOW|THLD(360)|HYST(120)", label: "GTR default (LOW + threshold/hysteresis)" },
  ] as GenOption[],
  home_sense: [
    { value: "OFF", label: "No home sensor" },
    { value: "HIGH", label: "HIGH" },
    { value: "LOW", label: "LOW" },
  ] as GenOption[],
  yesNo: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ] as GenOption[],
} as const;

// ---- defaults ---------------------------------------------------------------

/** PID defaults match the template's original hardcoded values. */
const PID_DEFAULTS = {
  p: "3.0",
  i: "1.0",
  d: "0.0",
  p_goto: "1.0",
  i_goto: "0.0",
  d_goto: "0.0",
} as const;

export const GENERATOR_DEFAULTS: GeneratorConfig = {
  model: "GTR",
  options: " - ",
  compensation: "OFF",
  wifi_mode: "WIFI_ACCESS_POINT",
  ap_enabled: "true",
  ap_ssid: "JTW Trident",
  ap_password: "password",
  ap_wifi_ip: "{192,168,0,1}",
  ap_wifi_mask: "{255,255,255,0}",
  sta_enabled: "false",
  sta_ssid: "Home",
  sta_password: "password",
  wifi_dhcp: "true",
  sta_wifi_ip: "{192,168,1,55}",
  sta_wifi_gw: "{192,168,1,1}",
  sta_wifi_mask: "{255,255,255,0}",
  eth_dhcp: "true",
  eth_ip: "{192,168,1,56}",
  eth_gw: "{192,168,1,1}",
  eth_mask: "{255,255,255,0}",
  weather_mode: "OFF",
  weather: "ON",
  temp: "ON",
  monitor: "OFF",
  origin: "OFF",
  calibration: "OFF",
  encoder: "OFF",
  encoder_count: "0",
  driver: "TMC2209",
  tls: "DS3231",
  tls_fallback: "OFF",
  pps: "OFF",
  pps_detect: "OFF",
  pec_spwr: "0",
  pec_sense: "OFF",
  home_sense: "OFF",
  home_switch: "OFF",
  home_range: "7200",
  axis1_microsteps: "OFF",
  axis1_microsteps_goto: "OFF",
  axis2_microsteps: "OFF",
  axis2_microsteps_goto: "OFF",
  axis1_reverse: "OFF",
  axis2_reverse: "OFF",
  axis1_encoder_reverse: "OFF",
  axis2_encoder_reverse: "OFF",
  axis1_pid_p: PID_DEFAULTS.p,
  axis1_pid_i: PID_DEFAULTS.i,
  axis1_pid_d: PID_DEFAULTS.d,
  axis1_pid_p_goto: PID_DEFAULTS.p_goto,
  axis1_pid_i_goto: PID_DEFAULTS.i_goto,
  axis1_pid_d_goto: PID_DEFAULTS.d_goto,
  axis2_pid_p: PID_DEFAULTS.p,
  axis2_pid_i: PID_DEFAULTS.i,
  axis2_pid_d: PID_DEFAULTS.d,
  axis2_pid_p_goto: PID_DEFAULTS.p_goto,
  axis2_pid_i_goto: PID_DEFAULTS.i_goto,
  axis2_pid_d_goto: PID_DEFAULTS.d_goto,
};

export const DEFAULT_ANSWERS: GeneratorAnswers = {
  version: DEFAULT_VERSION,
  model: "GTR",
  compensation: "OFF",
  encoder: "OFF",
  axis1_reverse: "OFF",
  axis2_reverse: "OFF",
  axis1_encoder_reverse: "OFF",
  axis2_encoder_reverse: "OFF",
  axis1_pid_p: PID_DEFAULTS.p,
  axis1_pid_i: PID_DEFAULTS.i,
  axis1_pid_d: PID_DEFAULTS.d,
  axis1_pid_p_goto: PID_DEFAULTS.p_goto,
  axis1_pid_i_goto: PID_DEFAULTS.i_goto,
  axis1_pid_d_goto: PID_DEFAULTS.d_goto,
  axis2_pid_p: PID_DEFAULTS.p,
  axis2_pid_i: PID_DEFAULTS.i,
  axis2_pid_d: PID_DEFAULTS.d,
  axis2_pid_p_goto: PID_DEFAULTS.p_goto,
  axis2_pid_i_goto: PID_DEFAULTS.i_goto,
  axis2_pid_d_goto: PID_DEFAULTS.d_goto,
  pec_spwr: "0",
  pec_sense: "OFF",
  home_sense: "OFF",
  home_switch: "OFF",
  home_range: "7200",
  wifi_mode: "WIFI_ACCESS_POINT",
  ap_ssid: "JTW Trident",
  ap_password: "password",
  ap_wifi_ip: "192.168.0.1",
  ap_wifi_mask: "255.255.255.0",
  sta_ssid: "Home",
  sta_password: "password",
  wifi_dhcp: "true",
  sta_wifi_ip: "192.168.1.55",
  sta_wifi_mask: "255.255.255.0",
  sta_wifi_gw: "192.168.1.1",
  eth_dhcp: "true",
  eth_ip: "192.168.1.56",
  eth_mask: "255.255.255.0",
  eth_gw: "192.168.1.1",
  weather_mode: "OFF",
  tls: "DS3231",
  pps: "OFF",
  pps_detect: "OFF",
};

const ENCODER_COUNTS: Record<string, string> = {
  OFF: "0",
  JTW_24BIT: "46603.377778",
  JTW_26BIT: "186413.511111",
  AS37_H39B_B: "23301.689",
};

/** Values a GTR with homing (no encoders) ships with — used to pre-fill the wizard. */
export const GTR_HOMING_DEFAULTS = {
  pec_spwr: "102400",
  pec_sense: "LOW|THLD(360)|HYST(120)",
  home_sense: "HIGH",
  home_switch: "ON",
  home_range: "7200",
} as const;

/** Normalize "1.2.3.4" or "{1,2,3,4}" to the "{1,2,3,4}" brace form templates expect. */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  if (/^\{\s*\d{1,3}\s*(,\s*\d{1,3}\s*){3}\}$/.test(trimmed)) return trimmed.replace(/\s+/g, "");
  const m = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) return `{${m[1]},${m[2]},${m[3]},${m[4]}}`;
  return trimmed;
}

/** Maps wizard answers to the complete template substitution map (Manticore only). */
export function deriveConfig(a: GeneratorAnswers): GeneratorConfig {
  const c: GeneratorConfig = { ...GENERATOR_DEFAULTS };

  c.model = a.model;
  c.compensation = a.compensation;
  c.encoder = a.encoder;
  let options = " - ";

  if (a.model === "GTR" && a.encoder === "OFF") options += "H P ";

  // Reversal (per axis).
  c.axis1_reverse = a.axis1_reverse;
  c.axis2_reverse = a.axis2_reverse;
  c.axis1_encoder_reverse = a.axis1_encoder_reverse;
  c.axis2_encoder_reverse = a.axis2_encoder_reverse;

  // PID (per axis).
  c.axis1_pid_p = a.axis1_pid_p;
  c.axis1_pid_i = a.axis1_pid_i;
  c.axis1_pid_d = a.axis1_pid_d;
  c.axis1_pid_p_goto = a.axis1_pid_p_goto;
  c.axis1_pid_i_goto = a.axis1_pid_i_goto;
  c.axis1_pid_d_goto = a.axis1_pid_d_goto;
  c.axis2_pid_p = a.axis2_pid_p;
  c.axis2_pid_i = a.axis2_pid_i;
  c.axis2_pid_d = a.axis2_pid_d;
  c.axis2_pid_p_goto = a.axis2_pid_p_goto;
  c.axis2_pid_i_goto = a.axis2_pid_i_goto;
  c.axis2_pid_d_goto = a.axis2_pid_d_goto;

  // PEC + homing.
  c.pec_spwr = a.pec_spwr || "0";
  c.pec_sense = a.pec_sense;
  c.home_sense = a.home_sense;
  c.home_switch = a.home_switch;
  c.home_range = a.home_range || "7200";

  // Wi-Fi / Bluetooth.
  options += applyWifiMode(a, c);

  // Ethernet.
  c.eth_dhcp = a.eth_dhcp;
  if (a.eth_dhcp === "false") {
    c.eth_ip = normalizeIp(a.eth_ip);
    c.eth_mask = normalizeIp(a.eth_mask);
    c.eth_gw = normalizeIp(a.eth_gw);
  }

  // Weather + clock. NTP only valid with station Wi-Fi.
  c.weather_mode = a.weather_mode;
  let tls = a.tls;
  if (tls === "NTP" && a.wifi_mode !== "WIFI_STATION") tls = "DS3231";
  c.tls = tls;
  if (tls === "GPS") {
    c.tls_fallback = "DS3231";
    c.pps = a.pps;
    if (a.pps === "ON") c.pps_detect = a.pps_detect;
  }

  // Inferred: encoder count + driver + servo displays.
  c.encoder_count = ENCODER_COUNTS[c.encoder] ?? "0";
  c.driver = c.encoder !== "OFF" ? "SERVO_TMC2209" : "TMC2209";
  if (c.driver === "SERVO_TMC2209") {
    c.monitor = "ON";
    c.origin = "ON";
    c.calibration = "ON";
    // OnStepX requires MICROSTEPS=256 / MICROSTEPS_GOTO=OFF for SERVO_TMC2209.
    c.axis1_microsteps = "256";
    c.axis2_microsteps = "256";
    c.axis1_microsteps_goto = "OFF";
    c.axis2_microsteps_goto = "OFF";
  }

  // Descriptive options string.
  if (c.encoder === "JTW_24BIT") options += "24b ";
  if (c.encoder === "JTW_26BIT") options += "26b ";
  if (c.encoder === "AS37_H39B_B") options += "23b ";
  if (tls === "GPS") options += "GPS ";
  if (tls === "NTP") options += "NTP ";
  if (c.weather_mode === "BME280_0x76") options += "TPH ";
  c.options = options;

  return c;
}

function applyWifiMode(a: GeneratorAnswers, c: GeneratorConfig): string {
  switch (a.wifi_mode) {
    case "WIFI_ACCESS_POINT":
      c.ap_enabled = "true";
      c.sta_enabled = "false";
      c.wifi_mode = "WIFI_ACCESS_POINT";
      c.ap_ssid = a.ap_ssid;
      c.ap_password = a.ap_password;
      c.ap_wifi_ip = normalizeIp(a.ap_wifi_ip);
      c.ap_wifi_mask = normalizeIp(a.ap_wifi_mask);
      return "Wa ";
    case "WIFI_STATION":
      c.ap_enabled = "false";
      c.sta_enabled = "true";
      c.wifi_mode = "WIFI_STATION";
      c.sta_ssid = a.sta_ssid;
      c.sta_password = a.sta_password;
      c.wifi_dhcp = a.wifi_dhcp;
      if (a.wifi_dhcp === "false") {
        c.sta_wifi_ip = normalizeIp(a.sta_wifi_ip);
        c.sta_wifi_mask = normalizeIp(a.sta_wifi_mask);
        c.sta_wifi_gw = normalizeIp(a.sta_wifi_gw);
      }
      return "Ws ";
    case "BLUETOOTH":
      c.ap_enabled = "false";
      c.sta_enabled = "false";
      c.wifi_mode = "BLUETOOTH";
      return "Bt ";
    default: // OFF
      c.ap_enabled = "false";
      c.sta_enabled = "false";
      c.wifi_mode = "OFF";
      return "";
  }
}
