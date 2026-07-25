// JTW mount configuration generator — derived from the wizard in
// MichelMoriniaux/JTW-Trident-Mounts/generator/generator.py, extended with
// mount-type presets, per-axis reversal/PID/servo settings, PEC, homing, display
// overrides, an AP+station Wi-Fi model, advanced mount options, and
// firmware-version targeting.
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

/** Mount-type presets (section 1) — pre-populate the detailed options. */
export type MountTypeId =
  | "P75-base"
  | "P75-23b"
  | "P75-24b"
  | "GTR-base"
  | "GTR-24b"
  | "GTR-26b";

export interface GeneratorAnswers {
  mount_type: MountTypeId;
  version: MountVersion;
  model: MountModel;
  compensation: string;
  encoder: string; // OFF | JTW_24BIT | JTW_26BIT | AS37_H39B_B

  // Reversal (per axis)
  axis1_reverse: string; // OFF | ON  (motor / movement direction)
  axis2_reverse: string;
  axis1_encoder_reverse: string; // OFF | ON
  axis2_encoder_reverse: string;

  // Servo settings (per axis): PID + filter + acceleration + sensitivity
  axis1_pid_p: string;
  axis1_pid_i: string;
  axis1_pid_d: string;
  axis1_pid_p_goto: string;
  axis1_pid_i_goto: string;
  axis1_pid_d_goto: string;
  axis1_pid_sensitivity: string;
  axis1_servo_acceleration: string;
  axis1_servo_fltr_meas_u: string;
  axis1_servo_fltr_variance: string;
  axis2_pid_p: string;
  axis2_pid_i: string;
  axis2_pid_d: string;
  axis2_pid_p_goto: string;
  axis2_pid_i_goto: string;
  axis2_pid_d_goto: string;
  axis2_pid_sensitivity: string;
  axis2_servo_acceleration: string;
  axis2_servo_fltr_meas_u: string;
  axis2_servo_fltr_variance: string;
  // Servo filter type (per axis) + its rolling window size
  axis1_servo_fltr: string; // OFF | KALMAN | ROLLING | WINDOWING | LEARNING
  axis1_servo_fltr_wsize: string; // ROLLING window size
  axis2_servo_fltr: string;
  axis2_servo_fltr_wsize: string;

  // PEC
  pec_spwr: string; // steps per worm rotation, "0" disables
  pec_sense: string; // OFF | HIGH | LOW | LOW|THLD(360)|HYST(120)

  // Homing
  home_sense: string; // OFF | HIGH | LOW
  home_range_axis1: string; // arcsec
  home_range_axis2: string; // arcsec

  // Display overrides (ON | OFF) — auto-derived defaults, user-overridable
  display_weather: string; // auto: weather probe present
  display_temp: string;
  display_wifi_signal: string; // auto: Wi-Fi on (OnStepX only)
  display_monitor: string; // auto: servo
  display_origin: string; // auto: servo
  display_calibration: string; // auto: servo
  display_high_precision: string; // ON | OFF (10.28u only)
  home_switch: string; // HOME_SWITCH_DIRECTION_CONTROL (ON | OFF)

  // Wi-Fi (checkbox-gated; AP and station are independent and may both be on)
  wifi_enabled: string; // "true" | "false"
  wifi_ap: string; // "true" | "false"
  wifi_sta: string; // "true" | "false"
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
  time_ip_addr: string; // NTP server IP (10.28u; only used when tls=NTP)
  pps: string; // OFF | ON
  pps_detect: string; // OFF | HIGH | LOW | BOTH
  nv_driver: string; // NV_MB85RC64 | NV_DEFAULT

  // Advanced mount options (pass straight through to OnStepX Config.h)
  mount_coords_memory: string; // OFF | ON
  mount_enable_in_standby: string; // OFF | ON
  status_buzzer_default: string; // OFF | ON
  status_buzzer_memory: string; // OFF | ON
  st4_interface: string; // OFF | ON
  st4_hand_control: string; // OFF | ON
  st4_hand_control_focuser: string; // OFF | ON
  slew_rate_memory: string; // OFF | ON
  goto_feature: string; // OFF | ON
  limit_sense: string; // OFF | HIGH | LOW
  park_sense: string; // OFF | HIGH | LOW
  park_signal: string; // OFF | HIGH | LOW
  park_status: string; // OFF | HIGH | LOW
  park_strict: string; // OFF | ON
  mflip_skip_home: string; // OFF | ON
  mflip_automatic_default: string; // OFF | ON
  mflip_automatic_memory: string; // OFF | ON
  mflip_pause_home_default: string; // OFF | ON
  mflip_pause_home_memory: string; // OFF | ON
  pier_side_sync_change_sides: string; // OFF | ON
  pier_side_preferred_default: string; // BEST | EAST | WEST
  pier_side_preferred_memory: string; // OFF | ON
  align_auto_home: string; // OFF | ON
  align_model_memory: string; // OFF | ON
  align_max_stars: string; // AUTO | n

  // Debug / maintenance — operate on the Extended.config.h DEBUG / NV_WIPE defines.
  onstepx_debug: string; // "true" | "false"
  onstepx_nvwipe: string; // "true" | "false"
  sws_debug: string; // "true" | "false"
  sws_nvwipe: string; // "true" | "false"
}

/** Advanced answer keys that map 1:1 onto template placeholders. */
export const ADVANCED_KEYS: (keyof GeneratorAnswers)[] = [
  "axis1_pid_sensitivity", "axis1_servo_acceleration", "axis1_servo_fltr_meas_u", "axis1_servo_fltr_variance",
  "axis2_pid_sensitivity", "axis2_servo_acceleration", "axis2_servo_fltr_meas_u", "axis2_servo_fltr_variance",
  "axis1_servo_fltr", "axis1_servo_fltr_wsize", "axis2_servo_fltr", "axis2_servo_fltr_wsize",
  "home_range_axis1", "home_range_axis2",
  "mount_coords_memory", "mount_enable_in_standby",
  "status_buzzer_default", "status_buzzer_memory",
  "st4_interface", "st4_hand_control", "st4_hand_control_focuser",
  "slew_rate_memory", "goto_feature",
  "limit_sense", "park_sense", "park_signal", "park_status", "park_strict",
  "mflip_skip_home", "mflip_automatic_default", "mflip_automatic_memory", "mflip_pause_home_default", "mflip_pause_home_memory",
  "pier_side_sync_change_sides", "pier_side_preferred_default", "pier_side_preferred_memory",
  "align_auto_home", "align_model_memory", "align_max_stars",
];

/** Full substitution map (every template placeholder). */
export type GeneratorConfig = Record<string, string>;

export interface GeneratedFiles {
  // Plugins.config.h enables the website plugin; included in the OnStepX build
  // only when Wi-Fi is on (see wifiNeedsPlugin).
  onstepx: { "Config.h": string; "Extended.config.h": string; "Plugins.config.h": string };
  sws: { "Config.h": string; "Extended.config.h": string };
}

/**
 * Wi-Fi is only actually active when enabled AND at least one of AP / station is
 * on. Enabling Wi-Fi with both off deactivates the whole feature (otherwise the
 * website plugin + MDNS would be built against an OFF radio and fail to compile).
 */
export function wifiActive(a: GeneratorAnswers): boolean {
  return a.wifi_enabled === "true" && (a.wifi_ap === "true" || a.wifi_sta === "true");
}

/** Whether the OnStepX build needs the website plugin (Wi-Fi active). */
export function wifiNeedsPlugin(a: GeneratorAnswers): boolean {
  return wifiActive(a);
}

export interface GenOption {
  value: string;
  label: string;
  help?: string;
  models?: MountModel[];
}

// ---- option lists -----------------------------------------------------------

export const GEN_OPTIONS = {
  mount_type: [
    { value: "GTR-base", label: "GTR-base", help: "GTR with homing + PEC, no encoders." },
    { value: "GTR-24b", label: "GTR-24b", help: "GTR with 24-bit encoders." },
    { value: "GTR-26b", label: "GTR-26b", help: "GTR with 26-bit encoders." },
    { value: "P75-base", label: "P75-base", help: "P75 with no encoders, homing or PEC." },
    { value: "P75-23b", label: "P75-23b", help: "P75 with 23-bit encoders." },
    { value: "P75-24b", label: "P75-24b", help: "P75 with 24-bit encoders." },
  ] as GenOption[],
  version: [
    { value: "10.28u", label: "10.28u", help: "OnStepX 10.28u." },
    { value: "10.25p", label: "10.25p", help: "OnStepX 10.25p." },
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
  weather_mode: [
    { value: "OFF", label: "No TPH probe" },
    { value: "BME280_0x76", label: "BME680/280 on AUX (I²C)", help: "JTW I²C temperature/pressure/humidity probe on the AUX port." },
  ] as GenOption[],
  tls: [
    { value: "DS3231", label: "Onboard RTC (DS3231)", help: "Preferred." },
    { value: "NTP", label: "NTP server", help: "Requires station Wi-Fi; uses time-a-g.nist.gov." },
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
  offHighLow: [
    { value: "OFF", label: "Off" },
    { value: "HIGH", label: "HIGH" },
    { value: "LOW", label: "LOW" },
  ] as GenOption[],
  pier_side_preferred: [
    { value: "BEST", label: "Best (stay on current side)" },
    { value: "EAST", label: "East" },
    { value: "WEST", label: "West" },
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
  servo_fltr: [
    { value: "OFF", label: "Off (no filter)" },
    { value: "KALMAN", label: "Kalman", help: "Uses measurement uncertainty + variance." },
    { value: "ROLLING", label: "Rolling average", help: "Uses a window size." },
    { value: "WINDOWING", label: "Windowing" },
    { value: "LEARNING", label: "Learning" },
  ] as GenOption[],
  nv_driver: [
    { value: "NV_MB85RC64", label: "MB85RC64 FRAM (default)", help: "Standard JTW non-volatile storage chip." },
    { value: "NV_DEFAULT", label: "Default / no FRAM", help: "Ignore FRAM support; use the platform default." },
  ] as GenOption[],
  yesNo: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ] as GenOption[],
} as const;

// ---- mount-type presets -----------------------------------------------------

const HOMING_ON = { home_sense: "HIGH", home_switch: "ON", home_range_axis1: "648000", home_range_axis2: "648000" };
const HOMING_OFF = { home_sense: "OFF", home_switch: "OFF", home_range_axis1: "648000", home_range_axis2: "648000" };
const PEC_ON = { pec_spwr: "102400", pec_sense: "LOW|THLD(360)|HYST(120)" };
const PEC_OFF = { pec_spwr: "0", pec_sense: "OFF" };
const REV_OFF = { axis1_encoder_reverse: "OFF", axis2_encoder_reverse: "OFF" };
const REV_ON = { axis1_encoder_reverse: "ON", axis2_encoder_reverse: "ON" };
const DISP_SERVO_ON = { display_monitor: "ON", display_origin: "ON", display_calibration: "ON" };
const DISP_SERVO_OFF = { display_monitor: "OFF", display_origin: "OFF", display_calibration: "OFF" };

/** Values a mount type implies for the detailed options (section 4). */
export const MOUNT_TYPE_PRESETS: Record<MountTypeId, Partial<GeneratorAnswers>> = {
  "GTR-base": { model: "GTR", encoder: "OFF", ...HOMING_ON, ...PEC_ON, ...REV_OFF, ...DISP_SERVO_OFF },
  "GTR-24b": { model: "GTR", encoder: "JTW_24BIT", ...HOMING_OFF, ...PEC_OFF, ...REV_ON, ...DISP_SERVO_ON },
  "GTR-26b": { model: "GTR", encoder: "JTW_26BIT", ...HOMING_OFF, ...PEC_OFF, ...REV_ON, ...DISP_SERVO_ON },
  "P75-base": { model: "P75", encoder: "OFF", ...HOMING_OFF, ...PEC_OFF, ...REV_OFF, ...DISP_SERVO_OFF },
  "P75-23b": { model: "P75", encoder: "AS37_H39B_B", ...HOMING_OFF, ...PEC_OFF, ...REV_OFF, ...DISP_SERVO_ON },
  "P75-24b": { model: "P75", encoder: "JTW_24BIT", ...HOMING_OFF, ...PEC_OFF, ...REV_ON, ...DISP_SERVO_ON },
};

/** Apply a mount-type preset onto answers (used by the wizard, section 1). */
export function applyMountType(a: GeneratorAnswers, id: MountTypeId): GeneratorAnswers {
  return { ...a, mount_type: id, ...MOUNT_TYPE_PRESETS[id] };
}

// ---- defaults ---------------------------------------------------------------

const PID_DEFAULTS = { p: "3.0", i: "1.0", d: "0.0", p_goto: "1.0", i_goto: "0.0", d_goto: "0.0" } as const;
const SERVO_DEFAULTS = { acceleration: "100", fltr_meas_u: "8", fltr_variance: "0.25", sensitivity: "0" } as const;

/** Advanced-option config defaults (mirror the templates' original values). */
const ADVANCED_DEFAULTS: Record<string, string> = {
  axis1_pid_sensitivity: SERVO_DEFAULTS.sensitivity,
  axis1_servo_acceleration: SERVO_DEFAULTS.acceleration,
  axis1_servo_fltr_meas_u: SERVO_DEFAULTS.fltr_meas_u,
  axis1_servo_fltr_variance: SERVO_DEFAULTS.fltr_variance,
  axis2_pid_sensitivity: SERVO_DEFAULTS.sensitivity,
  axis2_servo_acceleration: SERVO_DEFAULTS.acceleration,
  axis2_servo_fltr_meas_u: SERVO_DEFAULTS.fltr_meas_u,
  axis2_servo_fltr_variance: SERVO_DEFAULTS.fltr_variance,
  home_range_axis1: "648000",
  home_range_axis2: "648000",
  mount_coords_memory: "OFF",
  mount_enable_in_standby: "OFF",
  status_buzzer_default: "OFF",
  status_buzzer_memory: "ON",
  st4_interface: "ON",
  st4_hand_control: "ON",
  st4_hand_control_focuser: "ON",
  slew_rate_memory: "ON",
  goto_feature: "ON",
  limit_sense: "OFF",
  park_sense: "OFF",
  park_signal: "OFF",
  park_status: "OFF",
  park_strict: "OFF",
  mflip_skip_home: "ON",
  mflip_automatic_default: "ON",
  mflip_automatic_memory: "ON",
  mflip_pause_home_default: "OFF",
  mflip_pause_home_memory: "ON",
  pier_side_sync_change_sides: "OFF",
  pier_side_preferred_default: "EAST",
  pier_side_preferred_memory: "ON",
  align_auto_home: "OFF",
  align_model_memory: "ON",
  align_max_stars: "AUTO",
};

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
  display_wifi_signal: "OFF",
  display_high_precision: "ON",
  mdns_server: "OFF",
  time_ip_addr: "{129,6,15,28}",
  axis1_servo_fltr: "KALMAN",
  axis2_servo_fltr: "KALMAN",
  axis1_servo_fltr_wsize: "10",
  axis2_servo_fltr_wsize: "10",
  encoder: "OFF",
  encoder_count: "0",
  driver: "TMC2209",
  tls: "DS3231",
  tls_fallback: "OFF",
  pps: "OFF",
  pps_detect: "OFF",
  nv_driver: "NV_MB85RC64",
  onstepx_debug: "OFF",
  onstepx_nv_wipe: "OFF",
  sws_debug: "OFF",
  sws_nv_wipe: "OFF",
  pec_spwr: "0",
  pec_sense: "OFF",
  home_sense: "OFF",
  home_switch: "OFF",
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
  ...ADVANCED_DEFAULTS,
};

// Default answers = GTR-base preset + AP Wi-Fi + GPS/TPH defaults.
export const DEFAULT_ANSWERS: GeneratorAnswers = {
  mount_type: "GTR-base",
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
  axis1_pid_sensitivity: SERVO_DEFAULTS.sensitivity,
  axis1_servo_acceleration: SERVO_DEFAULTS.acceleration,
  axis1_servo_fltr_meas_u: SERVO_DEFAULTS.fltr_meas_u,
  axis1_servo_fltr_variance: SERVO_DEFAULTS.fltr_variance,
  axis2_pid_p: PID_DEFAULTS.p,
  axis2_pid_i: PID_DEFAULTS.i,
  axis2_pid_d: PID_DEFAULTS.d,
  axis2_pid_p_goto: PID_DEFAULTS.p_goto,
  axis2_pid_i_goto: PID_DEFAULTS.i_goto,
  axis2_pid_d_goto: PID_DEFAULTS.d_goto,
  axis2_pid_sensitivity: SERVO_DEFAULTS.sensitivity,
  axis2_servo_acceleration: SERVO_DEFAULTS.acceleration,
  axis2_servo_fltr_meas_u: SERVO_DEFAULTS.fltr_meas_u,
  axis2_servo_fltr_variance: SERVO_DEFAULTS.fltr_variance,
  axis1_servo_fltr: "KALMAN",
  axis1_servo_fltr_wsize: "10",
  axis2_servo_fltr: "KALMAN",
  axis2_servo_fltr_wsize: "10",
  pec_spwr: PEC_ON.pec_spwr,
  pec_sense: PEC_ON.pec_sense,
  home_sense: HOMING_ON.home_sense,
  home_switch: HOMING_ON.home_switch,
  home_range_axis1: HOMING_ON.home_range_axis1,
  home_range_axis2: HOMING_ON.home_range_axis2,
  display_weather: "ON", // weather probe default on
  display_temp: "ON",
  display_wifi_signal: "ON", // Wi-Fi default on
  display_monitor: "OFF",
  display_origin: "OFF",
  display_calibration: "OFF",
  display_high_precision: "ON",
  wifi_enabled: "true",
  wifi_ap: "true",
  wifi_sta: "false",
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
  weather_mode: "BME280_0x76", // TPH probe default for all mounts
  tls: "GPS", // GPS dongle default for all mounts
  time_ip_addr: "129.6.15.28",
  pps: "OFF",
  pps_detect: "OFF",
  nv_driver: "NV_MB85RC64",
  mount_coords_memory: ADVANCED_DEFAULTS.mount_coords_memory,
  mount_enable_in_standby: ADVANCED_DEFAULTS.mount_enable_in_standby,
  status_buzzer_default: ADVANCED_DEFAULTS.status_buzzer_default,
  status_buzzer_memory: ADVANCED_DEFAULTS.status_buzzer_memory,
  st4_interface: ADVANCED_DEFAULTS.st4_interface,
  st4_hand_control: ADVANCED_DEFAULTS.st4_hand_control,
  st4_hand_control_focuser: ADVANCED_DEFAULTS.st4_hand_control_focuser,
  slew_rate_memory: ADVANCED_DEFAULTS.slew_rate_memory,
  goto_feature: ADVANCED_DEFAULTS.goto_feature,
  limit_sense: ADVANCED_DEFAULTS.limit_sense,
  park_sense: ADVANCED_DEFAULTS.park_sense,
  park_signal: ADVANCED_DEFAULTS.park_signal,
  park_status: ADVANCED_DEFAULTS.park_status,
  park_strict: ADVANCED_DEFAULTS.park_strict,
  mflip_skip_home: ADVANCED_DEFAULTS.mflip_skip_home,
  mflip_automatic_default: ADVANCED_DEFAULTS.mflip_automatic_default,
  mflip_automatic_memory: ADVANCED_DEFAULTS.mflip_automatic_memory,
  mflip_pause_home_default: ADVANCED_DEFAULTS.mflip_pause_home_default,
  mflip_pause_home_memory: ADVANCED_DEFAULTS.mflip_pause_home_memory,
  pier_side_sync_change_sides: ADVANCED_DEFAULTS.pier_side_sync_change_sides,
  pier_side_preferred_default: ADVANCED_DEFAULTS.pier_side_preferred_default,
  pier_side_preferred_memory: ADVANCED_DEFAULTS.pier_side_preferred_memory,
  align_auto_home: ADVANCED_DEFAULTS.align_auto_home,
  align_model_memory: ADVANCED_DEFAULTS.align_model_memory,
  align_max_stars: ADVANCED_DEFAULTS.align_max_stars,
  onstepx_debug: "false",
  onstepx_nvwipe: "false",
  sws_debug: "false",
  sws_nvwipe: "false",
};

const ENCODER_COUNTS: Record<string, string> = {
  OFF: "0",
  JTW_24BIT: "46603.377778",
  JTW_26BIT: "186413.511111",
  AS37_H39B_B: "23301.689",
};

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

  // Advanced options (servo filter/accel/sensitivity, per-axis home range,
  // mount/status/ST4/park/mflip/pier-side/align) — straight passthrough.
  for (const k of ADVANCED_KEYS) c[k] = a[k];

  // PEC + homing.
  c.pec_spwr = a.pec_spwr || "0";
  c.pec_sense = a.pec_sense;
  c.home_sense = a.home_sense;
  c.home_range_axis1 = a.home_range_axis1 || "648000";
  c.home_range_axis2 = a.home_range_axis2 || "648000";

  // Displays (user-overridable; defaults auto-derived in the wizard).
  c.weather = a.display_weather;
  c.temp = a.display_temp;
  c.monitor = a.display_monitor;
  c.origin = a.display_origin;
  c.calibration = a.display_calibration;
  c.display_wifi_signal = a.display_wifi_signal;
  c.display_high_precision = a.display_high_precision;
  c.home_switch = a.home_switch;

  // Wi-Fi (AP and station independent). Both off => Wi-Fi fully deactivated.
  const active = wifiActive(a);
  const staOn = active && a.wifi_sta === "true";
  if (active) {
    const ap = a.wifi_ap === "true";
    c.ap_enabled = ap ? "true" : "false";
    c.sta_enabled = staOn ? "true" : "false";
    c.wifi_mode = ap ? "WIFI_ACCESS_POINT" : "WIFI_STATION"; // at least one is on
    if (ap) {
      c.ap_ssid = a.ap_ssid;
      c.ap_password = a.ap_password;
      c.ap_wifi_ip = normalizeIp(a.ap_wifi_ip);
      c.ap_wifi_mask = normalizeIp(a.ap_wifi_mask);
      options += "Wa ";
    }
    if (staOn) {
      c.sta_ssid = a.sta_ssid;
      c.sta_password = a.sta_password;
      c.wifi_dhcp = a.wifi_dhcp;
      if (a.wifi_dhcp === "false") {
        c.sta_wifi_ip = normalizeIp(a.sta_wifi_ip);
        c.sta_wifi_mask = normalizeIp(a.sta_wifi_mask);
        c.sta_wifi_gw = normalizeIp(a.sta_wifi_gw);
      }
      options += "Ws ";
    }
  } else {
    c.ap_enabled = "false";
    c.sta_enabled = "false";
    c.wifi_mode = "OFF";
  }
  // mDNS server is only meaningful when Wi-Fi is active (OnStepX, 10.28u).
  c.mdns_server = active ? "ON" : "OFF";

  // Ethernet.
  c.eth_dhcp = a.eth_dhcp;
  if (a.eth_dhcp === "false") {
    c.eth_ip = normalizeIp(a.eth_ip);
    c.eth_mask = normalizeIp(a.eth_mask);
    c.eth_gw = normalizeIp(a.eth_gw);
  }

  // Non-volatile storage driver.
  c.nv_driver = a.nv_driver;

  // Debug / maintenance flags in each firmware's Extended.config.h.
  c.onstepx_debug = a.onstepx_debug === "true" ? "VERBOSE" : "OFF";
  c.onstepx_nv_wipe = a.onstepx_nvwipe === "true" ? "ON" : "OFF";
  c.sws_debug = a.sws_debug === "true" ? "VERBOSE" : "OFF";
  c.sws_nv_wipe = a.sws_nvwipe === "true" ? "ON" : "OFF";

  // Weather + clock. NTP only valid with station Wi-Fi.
  c.weather_mode = a.weather_mode;
  c.time_ip_addr = normalizeIp(a.time_ip_addr); // NTP server IP (10.28u)
  let tls = a.tls;
  if (tls === "NTP" && !staOn) tls = "DS3231";
  c.tls = tls;
  if (tls === "GPS") {
    c.tls_fallback = "DS3231";
    c.pps = a.pps;
    if (a.pps === "ON") c.pps_detect = a.pps_detect;
  }

  // Inferred: encoder count + driver + servo microsteps.
  c.encoder_count = ENCODER_COUNTS[c.encoder] ?? "0";
  c.driver = c.encoder !== "OFF" ? "SERVO_TMC2209" : "TMC2209";
  if (c.driver === "SERVO_TMC2209") {
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
