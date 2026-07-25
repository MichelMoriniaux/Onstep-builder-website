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
          onChange={(c) => set({ wifi_enabled: c ? "true" : "false" })}
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
          <Select label="Encoders" value={answers.encoder} options={forModel(GEN_OPTIONS.encoder, answers.model)} onChange={(v) => set({ encoder: v })} />
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
        <Grid>
          <Select label="Home sensor" value={answers.home_sense} options={GEN_OPTIONS.home_sense} onChange={(v) => set({ home_sense: v })} />
          <Select label="Home switch reversal (SWS)" value={answers.home_switch} options={GEN_OPTIONS.onOff} onChange={(v) => set({ home_switch: v })} />
          <Text label="Home offset range (arcsec)" value={answers.home_range} onChange={(v) => set({ home_range: v })} mono />
        </Grid>
        </Subsection>

        <Subsection title="PEC">
        <Grid>
          <Select label="PEC sensor" value={answers.pec_sense} options={GEN_OPTIONS.pec_sense} onChange={(v) => set({ pec_sense: v })} />
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
          <Select label="Weather probe (TPH)" value={answers.weather_mode} options={GEN_OPTIONS.weather_mode} onChange={(v) => set({ weather_mode: v })} />
          <Select label="Clock source" value={answers.tls} options={tlsOpts} onChange={(v) => set({ tls: v })} />
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

        {hasEncoder && (
          <Subsection title="Servo PID (advanced)">
            <div className="space-y-4">
              <PidAxis title="Axis 1 (RA/Az)" a={answers} keys={["axis1_pid_p", "axis1_pid_i", "axis1_pid_d", "axis1_pid_p_goto", "axis1_pid_i_goto", "axis1_pid_d_goto"]} set={set} />
              <PidAxis title="Axis 2 (Dec/Alt)" a={answers} keys={["axis2_pid_p", "axis2_pid_i", "axis2_pid_d", "axis2_pid_p_goto", "axis2_pid_i_goto", "axis2_pid_d_goto"]} set={set} />
            </div>
          </Subsection>
        )}
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

const PID_LABELS = ["P (track)", "I (track)", "D (track)", "P (goto)", "I (goto)", "D (goto)"];

function PidAxis({
  title,
  a,
  keys,
  set,
}: {
  title: string;
  a: GeneratorAnswers;
  keys: (keyof GeneratorAnswers)[];
  set: (patch: Partial<GeneratorAnswers>) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-2">{title}</div>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k, i) => (
          <Text key={k} label={PID_LABELS[i]} value={a[k] as string} onChange={(v) => set({ [k]: v } as Partial<GeneratorAnswers>)} mono />
        ))}
      </div>
    </div>
  );
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
