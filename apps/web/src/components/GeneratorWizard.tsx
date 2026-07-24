import {
  GEN_OPTIONS,
  GenOption,
  GeneratorAnswers,
  GTR_HOMING_DEFAULTS,
  MountModel,
  MountVersion,
} from "@onstep/shared";

interface Props {
  answers: GeneratorAnswers;
  onChange: (a: GeneratorAnswers) => void;
}

function forModel(opts: readonly GenOption[], model: MountModel) {
  return opts.filter((o) => !o.models || o.models.includes(model));
}

export function GeneratorWizard({ answers, onChange }: Props) {
  const set = (patch: Partial<GeneratorAnswers>) => onChange({ ...answers, ...patch });
  const { model } = answers;
  const hasEncoder = answers.encoder !== "OFF";

  // NTP is only valid when the controller joins a Wi-Fi network.
  const tlsOpts = GEN_OPTIONS.tls.filter(
    (o) => o.value !== "NTP" || answers.wifi_mode === "WIFI_STATION"
  );

  // Encoder choice drives sensible PEC/homing + encoder-reverse defaults.
  const onEncoderChange = (encoder: string) => {
    const patch: Partial<GeneratorAnswers> = { encoder };
    if (encoder === "OFF") {
      if (model === "GTR") Object.assign(patch, GTR_HOMING_DEFAULTS); // GTR ships homing+PEC
      patch.axis1_encoder_reverse = "OFF";
      patch.axis2_encoder_reverse = "OFF";
    } else {
      // Encoder mounts don't use the homing/PEC sensors.
      Object.assign(patch, { pec_spwr: "0", pec_sense: "OFF", home_sense: "OFF", home_switch: "OFF" });
      if (encoder === "AS37_H39B_B") {
        patch.axis1_encoder_reverse = "ON";
        patch.axis2_encoder_reverse = "ON";
      }
    }
    set(patch);
  };

  const onWifiChange = (wifi_mode: string) => {
    const patch: Partial<GeneratorAnswers> = { wifi_mode };
    if (answers.tls === "NTP" && wifi_mode !== "WIFI_STATION") patch.tls = "DS3231";
    set(patch);
  };

  return (
    <div className="space-y-6">
      <Section title="Mount">
        <Select
          label="Firmware version"
          value={answers.version}
          options={GEN_OPTIONS.version}
          onChange={(v) => set({ version: v as MountVersion })}
        />
        <Select
          label="Model"
          value={model}
          options={GEN_OPTIONS.model}
          onChange={(v) => set({ model: v as MountModel, encoder: "OFF" })}
        />
        <Select
          label="Encoders"
          value={answers.encoder}
          options={forModel(GEN_OPTIONS.encoder, model)}
          onChange={onEncoderChange}
        />
        <Select
          label="Tracking compensation"
          value={answers.compensation}
          options={GEN_OPTIONS.compensation}
          onChange={(v) => set({ compensation: v })}
        />
      </Section>

      <Section title="Reversal">
        <Select label="Axis 1 (RA/Az) motor" value={answers.axis1_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis1_reverse: v })} />
        <Select label="Axis 2 (Dec/Alt) motor" value={answers.axis2_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis2_reverse: v })} />
        {hasEncoder && (
          <>
            <Select label="Axis 1 encoder" value={answers.axis1_encoder_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis1_encoder_reverse: v })} />
            <Select label="Axis 2 encoder" value={answers.axis2_encoder_reverse} options={GEN_OPTIONS.onOff} onChange={(v) => set({ axis2_encoder_reverse: v })} />
          </>
        )}
      </Section>

      <Section title="Wireless">
        <Select
          label="Wi-Fi mode"
          value={answers.wifi_mode}
          options={GEN_OPTIONS.wifi_mode}
          onChange={onWifiChange}
        />
        {answers.wifi_mode === "WIFI_ACCESS_POINT" && (
          <>
            <Text label="AP SSID" value={answers.ap_ssid} onChange={(v) => set({ ap_ssid: v })} />
            <Text label="AP password" value={answers.ap_password} onChange={(v) => set({ ap_password: v })} />
            <Text label="AP IP" value={answers.ap_wifi_ip} onChange={(v) => set({ ap_wifi_ip: v })} mono />
            <Text label="AP netmask" value={answers.ap_wifi_mask} onChange={(v) => set({ ap_wifi_mask: v })} mono />
          </>
        )}
        {answers.wifi_mode === "WIFI_STATION" && (
          <>
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
          </>
        )}
      </Section>

      <Section title="Ethernet, clock & weather">
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
      </Section>

      <Section title="Homing">
        <Select label="Home sensor" value={answers.home_sense} options={GEN_OPTIONS.home_sense} onChange={(v) => set({ home_sense: v })} />
        <Select label="Home switch reversal (SWS)" value={answers.home_switch} options={GEN_OPTIONS.onOff} onChange={(v) => set({ home_switch: v })} />
        <Text label="Home offset range (arcsec)" value={answers.home_range} onChange={(v) => set({ home_range: v })} mono />
      </Section>

      <Section title="PEC">
        <Select label="PEC sensor" value={answers.pec_sense} options={GEN_OPTIONS.pec_sense} onChange={(v) => set({ pec_sense: v })} />
        <Text label="Steps per worm rotation (0 = off)" value={answers.pec_spwr} onChange={(v) => set({ pec_spwr: v })} mono />
      </Section>

      {hasEncoder && (
        <details className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-500">
            Servo PID (advanced)
          </summary>
          <div className="mt-4 space-y-4">
            <PidAxis
              title="Axis 1 (RA/Az)"
              a={answers}
              keys={["axis1_pid_p", "axis1_pid_i", "axis1_pid_d", "axis1_pid_p_goto", "axis1_pid_i_goto", "axis1_pid_d_goto"]}
              set={set}
            />
            <PidAxis
              title="Axis 2 (Dec/Alt)"
              a={answers}
              keys={["axis2_pid_p", "axis2_pid_i", "axis2_pid_d", "axis2_pid_p_goto", "axis2_pid_i_goto", "axis2_pid_d_goto"]}
              set={set}
            />
          </div>
        </details>
      )}
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
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
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
