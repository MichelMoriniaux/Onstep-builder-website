import {
  applyMountType,
  GEN_OPTIONS,
  GenOption,
  GeneratorAnswers,
  MountTypeId,
  MountVersion,
} from "@onstep/shared";

interface Props {
  answers: GeneratorAnswers;
  onChange: (a: GeneratorAnswers) => void;
}

function forModel(opts: readonly GenOption[], model: string) {
  return opts.filter((o) => !o.models || o.models.includes(model as "GTR" | "P75"));
}

export function GeneratorWizard({ answers, onChange }: Props) {
  const set = (patch: Partial<GeneratorAnswers>) => onChange({ ...answers, ...patch });
  const hasEncoder = answers.encoder !== "OFF";
  const wifiOn = answers.wifi_enabled === "true";
  const staOn = wifiOn && answers.wifi_sta === "true";

  // NTP needs station Wi-Fi.
  const tlsOpts = GEN_OPTIONS.tls.filter((o) => o.value !== "NTP" || staOn);

  return (
    <div className="space-y-8">
      {/* 1 — Mount type (pre-populates section 4) */}
      <Section title="1 · Mount type">
        <Select
          label="What mount do you have?"
          value={answers.mount_type}
          options={GEN_OPTIONS.mount_type}
          onChange={(v) => onChange(applyMountType(answers, v as MountTypeId))}
        />
      </Section>

      {/* 2 — Target version */}
      <Section title="2 · Firmware version">
        <Select
          label="Target version"
          value={answers.version}
          options={GEN_OPTIONS.version}
          onChange={(v) => set({ version: v as MountVersion })}
        />
      </Section>

      {/* 3 — Wi-Fi (gated) */}
      <div>
        <SectionTitle>3 · Wi-Fi</SectionTitle>
        <Checkbox
          label="Enable Wi-Fi"
          help="Adds the website plugin to the OnStepX build."
          checked={wifiOn}
          onChange={(c) => set({ wifi_enabled: c ? "true" : "false", display_wifi_signal: c ? "ON" : "OFF" })}
        />
        {wifiOn && (
          <div className="mt-3 pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-wrap gap-6">
              <Checkbox
                label="Access point"
                checked={answers.wifi_ap === "true"}
                onChange={(c) => set({ wifi_ap: c ? "true" : "false" })}
              />
              <Checkbox
                label="Station (join a network)"
                checked={answers.wifi_sta === "true"}
                onChange={(c) => set({ wifi_sta: c ? "true" : "false" })}
              />
            </div>
            {answers.wifi_ap !== "true" && answers.wifi_sta !== "true" && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Both access point and station are off — Wi-Fi will be disabled in the build.
              </p>
            )}
            {answers.wifi_ap === "true" && (
              <Grid>
                <Text label="AP SSID" value={answers.ap_ssid} onChange={(v) => set({ ap_ssid: v })} />
                <Text label="AP password" value={answers.ap_password} onChange={(v) => set({ ap_password: v })} />
                <Text label="AP IP" value={answers.ap_wifi_ip} onChange={(v) => set({ ap_wifi_ip: v })} mono />
                <Text label="AP netmask" value={answers.ap_wifi_mask} onChange={(v) => set({ ap_wifi_mask: v })} mono />
              </Grid>
            )}
            {answers.wifi_sta === "true" && (
              <Grid>
                <Text label="Network SSID" value={answers.sta_ssid} onChange={(v) => set({ sta_ssid: v })} />
                <Text label="Network password" value={answers.sta_password} onChange={(v) => set({ sta_password: v })} />
                <Select label="Use DHCP" value={answers.wifi_dhcp} options={GEN_OPTIONS.yesNo} onChange={(v) => set({ wifi_dhcp: v })} />
                {answers.wifi_dhcp === "false" && (
                  <>
                    <Text label="Static IP" value={answers.sta_wifi_ip} onChange={(v) => set({ sta_wifi_ip: v })} mono />
                    <Text label="Netmask" value={answers.sta_wifi_mask} onChange={(v) => set({ sta_wifi_mask: v })} mono />
                    <Text label="Gateway" value={answers.sta_wifi_gw} onChange={(v) => set({ sta_wifi_gw: v })} mono />
                  </>
                )}
              </Grid>
            )}
          </div>
        )}
      </div>

      {/* 4 — All options (override): expandable, with expandable subsections */}
      <Collapsible title="4 · Options">
        <p className="text-xs text-slate-500 mb-4">
          Pre-filled from the mount type — override anything here.
        </p>

        <Subsection title="Drivetrain" defaultOpen>
        <Grid>
          <Select label="Encoders" value={answers.encoder} options={forModel(GEN_OPTIONS.encoder, answers.model)} onChange={(v) => set({ encoder: v, display_monitor: v !== "OFF" ? "ON" : "OFF", display_origin: v !== "OFF" ? "ON" : "OFF", display_calibration: v !== "OFF" ? "ON" : "OFF" })} />
          <Select label="Tracking compensation" value={answers.compensation} options={GEN_OPTIONS.compensation} onChange={(v) => set({ compensation: v })} />
          <Select label="Axis 1 (RA/Az) motor reverse" value={answers.axis1_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis1_reverse: v })} />
          <Select label="Axis 2 (Dec/Alt) motor reverse" value={answers.axis2_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis2_reverse: v })} />
          {hasEncoder && (
            <>
              <Select label="Axis 1 encoder reverse" value={answers.axis1_encoder_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis1_encoder_reverse: v })} />
              <Select label="Axis 2 encoder reverse" value={answers.axis2_encoder_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis2_encoder_reverse: v })} />
            </>
          )}
        </Grid>
        </Subsection>

        <Subsection title="Homing">
        <div className="space-y-4">
          <Grid>
            <Select label="Home sensor" value={answers.home_sense} options={GEN_OPTIONS.home_sense} onChange={(v) => set({ home_sense: v })} />
          </Grid>
          {answers.home_sense !== "OFF" && (
            <Grid>
              <Text label="Home offset range Axis 1 (arcsec)" value={answers.home_range_axis1} onChange={(v) => set({ home_range_axis1: v })} mono />
              <Text label="Home offset range Axis 2 (arcsec)" value={answers.home_range_axis2} onChange={(v) => set({ home_range_axis2: v })} mono />
            </Grid>
          )}
        </div>
        </Subsection>

        <Subsection title="PEC">
        <Grid>
          <Select
            label="PEC sensor"
            value={answers.pec_sense}
            options={GEN_OPTIONS.pec_sense}
            onChange={(v) =>
              set({
                pec_sense: v,
                // Enabling a sensor defaults steps-per-worm to 102400; disabling clears it.
                ...(v === "OFF"
                  ? { pec_spwr: "0" }
                  : answers.pec_spwr === "0" || answers.pec_spwr === ""
                  ? { pec_spwr: "102400" }
                  : {}),
              })
            }
          />
          <Text label="Steps per worm rotation (0 = off)" value={answers.pec_spwr} onChange={(v) => set({ pec_spwr: v })} mono />
        </Grid>
        </Subsection>

        <Subsection title="Ethernet, clock &amp; weather">
        <Grid>
          <Select label="Ethernet DHCP" value={answers.eth_dhcp} options={GEN_OPTIONS.yesNo} onChange={(v) => set({ eth_dhcp: v })} />
          {answers.eth_dhcp === "false" && (
            <>
              <Text label="Ethernet IP" value={answers.eth_ip} onChange={(v) => set({ eth_ip: v })} mono />
              <Text label="Ethernet netmask" value={answers.eth_mask} onChange={(v) => set({ eth_mask: v })} mono />
              <Text label="Ethernet gateway" value={answers.eth_gw} onChange={(v) => set({ eth_gw: v })} mono />
            </>
          )}
          <Select label="Weather probe (TPH)" value={answers.weather_mode} options={GEN_OPTIONS.weather_mode} onChange={(v) => set({ weather_mode: v, display_weather: v !== "OFF" ? "ON" : "OFF" })} />
          <Select label="Clock source" value={answers.tls} options={tlsOpts} onChange={(v) => set({ tls: v })} />
          {answers.tls === "NTP" && answers.version === "10.28u" && (
            <Text label="NTP server IP" value={answers.time_ip_addr} onChange={(v) => set({ time_ip_addr: v })} mono />
          )}
          {answers.tls === "GPS" && (
            <>
              <Select label="Enable PPS" value={answers.pps} options={GEN_OPTIONS.pps} onChange={(v) => set({ pps: v })} />
              {answers.pps === "ON" && (
                <Select label="PPS edge" value={answers.pps_detect} options={GEN_OPTIONS.pps_detect} onChange={(v) => set({ pps_detect: v })} />
              )}
            </>
          )}
          <Select label="Non-volatile storage" value={answers.nv_driver} options={GEN_OPTIONS.nv_driver} onChange={(v) => set({ nv_driver: v })} />
        </Grid>
        </Subsection>

        <Subsection title="Display overrides">
          <p className="text-xs text-slate-500 mb-3">
            Auto-decided from your options (weather → weather display, Wi-Fi → signal strength, encoders →
            servo displays). Override any here.
          </p>
          <div className="space-y-2">
            <CheckRow label="Weather" v={answers.display_weather} on={(x) => set({ display_weather: x })} />
            <CheckRow label="Internal temperature" v={answers.display_temp} on={(x) => set({ display_temp: x })} />
            <CheckRow label="Wi-Fi signal strength (OnStepX)" v={answers.display_wifi_signal} on={(x) => set({ display_wifi_signal: x })} />
            <CheckRow label="Servo monitor" v={answers.display_monitor} on={(x) => set({ display_monitor: x })} />
            <CheckRow label="Servo origin controls" v={answers.display_origin} on={(x) => set({ display_origin: x })} />
            <CheckRow label="Servo calibration" v={answers.display_calibration} on={(x) => set({ display_calibration: x })} />
            {answers.version === "10.28u" && (
              <CheckRow label="High-precision coordinates" v={answers.display_high_precision} on={(x) => set({ display_high_precision: x })} />
            )}
            <CheckRow label="Home switch direction control" v={answers.home_switch} on={(x) => set({ home_switch: x })} />
          </div>
        </Subsection>

        {hasEncoder && (
          <Subsection title="Servo Settings (advanced)">
            <div className="space-y-4">
              <ServoAxis title="Axis 1 (RA/Az)" axis="axis1" a={answers} set={set} />
              <ServoAxis title="Axis 2 (Dec/Alt)" axis="axis2" a={answers} set={set} />
            </div>
          </Subsection>
        )}

        <Subsection title="Guiding & ST4">
        <Grid>
          <Select label="ST4 interface" value={answers.st4_interface} options={GEN_OPTIONS.onOff} onChange={(v) => set({ st4_interface: v })} />
          <Select label="ST4 hand control" value={answers.st4_hand_control} options={GEN_OPTIONS.onOff} onChange={(v) => set({ st4_hand_control: v })} />
          <Select label="ST4 hand control focuser" value={answers.st4_hand_control_focuser} options={GEN_OPTIONS.onOff} onChange={(v) => set({ st4_hand_control_focuser: v })} />
          <Select label="Remember slew rate" value={answers.slew_rate_memory} options={GEN_OPTIONS.onOff} onChange={(v) => set({ slew_rate_memory: v })} />
        </Grid>
        </Subsection>

        <Subsection title="Parking & limits">
        <Grid>
          <Select label="Limit sense" value={answers.limit_sense} options={GEN_OPTIONS.offHighLow} onChange={(v) => set({ limit_sense: v })} />
          <Select label="Park sense" value={answers.park_sense} options={GEN_OPTIONS.offHighLow} onChange={(v) => set({ park_sense: v })} />
          <Select label="Park signal" value={answers.park_signal} options={GEN_OPTIONS.offHighLow} onChange={(v) => set({ park_signal: v })} />
          <Select label="Park status" value={answers.park_status} options={GEN_OPTIONS.offHighLow} onChange={(v) => set({ park_status: v })} />
          <Select label="Park strict" value={answers.park_strict} options={GEN_OPTIONS.onOff} onChange={(v) => set({ park_strict: v })} />
        </Grid>
        </Subsection>

        <Subsection title="Meridian flip & pier side">
        <Grid>
          <Select label="MFLIP skip home" value={answers.mflip_skip_home} options={GEN_OPTIONS.onOff} onChange={(v) => set({ mflip_skip_home: v })} />
          <Select label="MFLIP automatic default" value={answers.mflip_automatic_default} options={GEN_OPTIONS.onOff} onChange={(v) => set({ mflip_automatic_default: v })} />
          <Select label="MFLIP automatic memory" value={answers.mflip_automatic_memory} options={GEN_OPTIONS.onOff} onChange={(v) => set({ mflip_automatic_memory: v })} />
          <Select label="MFLIP pause at home default" value={answers.mflip_pause_home_default} options={GEN_OPTIONS.onOff} onChange={(v) => set({ mflip_pause_home_default: v })} />
          <Select label="MFLIP pause at home memory" value={answers.mflip_pause_home_memory} options={GEN_OPTIONS.onOff} onChange={(v) => set({ mflip_pause_home_memory: v })} />
          <Select label="Sync can change pier side" value={answers.pier_side_sync_change_sides} options={GEN_OPTIONS.onOff} onChange={(v) => set({ pier_side_sync_change_sides: v })} />
          <Select label="Preferred pier side" value={answers.pier_side_preferred_default} options={GEN_OPTIONS.pier_side_preferred} onChange={(v) => set({ pier_side_preferred_default: v })} />
          <Select label="Remember preferred pier side" value={answers.pier_side_preferred_memory} options={GEN_OPTIONS.onOff} onChange={(v) => set({ pier_side_preferred_memory: v })} />
        </Grid>
        </Subsection>

        <Subsection title="Alignment">
        <Grid>
          <Select label="Auto-home before align" value={answers.align_auto_home} options={GEN_OPTIONS.onOff} onChange={(v) => set({ align_auto_home: v })} />
          <Select label="Remember pointing model" value={answers.align_model_memory} options={GEN_OPTIONS.onOff} onChange={(v) => set({ align_model_memory: v })} />
          <Text label="Max align stars (AUTO or n)" value={answers.align_max_stars} onChange={(v) => set({ align_max_stars: v })} mono />
        </Grid>
        </Subsection>

        <Subsection title="Mount & status">
        <Grid>
          <Select label="Remember mount coordinates" value={answers.mount_coords_memory} options={GEN_OPTIONS.onOff} onChange={(v) => set({ mount_coords_memory: v })} />
          <Select label="Enable drivers in standby" value={answers.mount_enable_in_standby} options={GEN_OPTIONS.onOff} onChange={(v) => set({ mount_enable_in_standby: v })} />
          <Select label="Status buzzer default" value={answers.status_buzzer_default} options={GEN_OPTIONS.onOff} onChange={(v) => set({ status_buzzer_default: v })} />
          <Select label="Remember buzzer setting" value={answers.status_buzzer_memory} options={GEN_OPTIONS.onOff} onChange={(v) => set({ status_buzzer_memory: v })} />
          <Select label="Goto feature" value={answers.goto_feature} options={GEN_OPTIONS.onOff} onChange={(v) => set({ goto_feature: v })} />
        </Grid>
        </Subsection>
      </Collapsible>

      {/* 5 — Debug / Maintenance */}
      <Collapsible title="5 · Debug / Maintenance">
        <Subsection title="OnStepX">
          <div className="space-y-3">
            <Checkbox
              label="Generate an NVRAM wipe image"
              help="Sets NV_WIPE=ON. Flash, wait ~2 min, then reflash a normal image — leaving it on wears the NV."
              checked={answers.onstepx_nvwipe === "true"}
              onChange={(c) => set({ onstepx_nvwipe: c ? "true" : "false" })}
            />
            <Checkbox
              label="Generate a debug image"
              help="Sets DEBUG=VERBOSE on the debug serial port."
              checked={answers.onstepx_debug === "true"}
              onChange={(c) => set({ onstepx_debug: c ? "true" : "false" })}
            />
          </div>
        </Subsection>
        <Subsection title="SmartWebServer">
          <div className="space-y-3">
            <Checkbox
              label="Generate an NVRAM wipe image"
              help="Sets NV_WIPE=ON. Flash, wait ~2 min, then reflash a normal image — leaving it on wears the NV."
              checked={answers.sws_nvwipe === "true"}
              onChange={(c) => set({ sws_nvwipe: c ? "true" : "false" })}
            />
            <Checkbox
              label="Generate a debug image"
              help="Sets DEBUG=VERBOSE on the debug serial port."
              checked={answers.sws_debug === "true"}
              onChange={(c) => set({ sws_debug: c ? "true" : "false" })}
            />
          </div>
        </Subsection>
      </Collapsible>
    </div>
  );
}

function ServoAxis({
  title,
  axis,
  a,
  set,
}: {
  title: string;
  axis: "axis1" | "axis2";
  a: GeneratorAnswers;
  set: (patch: Partial<GeneratorAnswers>) => void;
}) {
  const fltrKey = `${axis}_servo_fltr` as keyof GeneratorAnswers;
  const fltr = a[fltrKey] as string;
  const field = (label: string, suffix: string) => {
    const key = `${axis}_${suffix}` as keyof GeneratorAnswers;
    return <Text label={label} value={a[key] as string} onChange={(v) => set({ [key]: v } as Partial<GeneratorAnswers>)} mono />;
  };
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-2">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Select label="Servo filter" value={fltr} options={GEN_OPTIONS.servo_fltr} onChange={(v) => set({ [fltrKey]: v } as Partial<GeneratorAnswers>)} />
        {fltr === "KALMAN" && field("Filter meas U", "servo_fltr_meas_u")}
        {fltr === "KALMAN" && field("Filter variance", "servo_fltr_variance")}
        {fltr === "ROLLING" && field("Filter window size", "servo_fltr_wsize")}
        {field("Acceleration (%/s)", "servo_acceleration")}
        {field("PID sensitivity (%)", "pid_sensitivity")}
        {field("P (track)", "pid_p")}
        {field("I (track)", "pid_i")}
        {field("D (track)", "pid_d")}
        {field("P (goto)", "pid_p_goto")}
        {field("I (goto)", "pid_i_goto")}
        {field("D (goto)", "pid_d_goto")}
      </div>
    </div>
  );
}

/** A checkbox bound to an ON/OFF string value. */
function CheckRow({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return <Checkbox label={label} checked={v === "ON"} onChange={(c) => on(c ? "ON" : "OFF")} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <Grid>{children}</Grid>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{children}</h3>;
}

/** Section-level expandable (e.g. "4 · Options"). */
function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group/collap">
      <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
        <svg className="h-3.5 w-3.5 shrink-0 transition-transform group-open/collap:rotate-90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7 5l6 5-6 5V5z" />
        </svg>
        {title}
      </summary>
      <div>{children}</div>
    </details>
  );
}

/** Expandable subsection nested inside a Collapsible. */
function Subsection({
  title,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group/sub rounded-lg border border-slate-200 dark:border-slate-700 mb-3">
      <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <svg className="h-3.5 w-3.5 shrink-0 transition-transform group-open/sub:rotate-90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7 5l6 5-6 5V5z" />
        </svg>
        {title}
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Checkbox({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer select-none">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {help && <span className="block text-xs text-slate-500">{help}</span>}
      </span>
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly GenOption[];
  onChange: (v: string) => void;
}) {
  const help = options.find((o) => o.value === value)?.help;
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <span className="mt-1 block text-xs text-slate-500">{help}</span>}
    </label>
  );
}

function Text({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm ${
          mono ? "font-mono" : ""
        } focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none`}
      />
    </label>
  );
}
