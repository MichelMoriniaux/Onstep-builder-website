/* ---------------------------------------------------------------------------------------------------------------------------------
 * Configuration for OnStepX and JTW Trident mount/Manticore controller
 *
 *          For more information on setting OnStep up see http://www.stellarjourney.com/index.php?r=site/equipment_onstep 
 *                                 and join the OnStep Groups.io at https://groups.io/g/onstep
 *                             for JTW Trident specific help please email - info@jtwastronomy.com
 * 
 *           *** Read the compiler warnings and errors, they are there to help guard against invalid configurations ***
 *
 * ---------------------------------------------------------------------------------------------------------------------------------
 * ADJUST THE FOLLOWING TO CONFIGURE YOUR CONTROLLER FEATURES ----------------------------------------------------------------------
 * <-Req'd = always must set, <-Often = usually must set, Option = optional, Adjust = adjust as req'd, Infreq = infrequently changed
*/
//      Parameter Name              Value   Default  Notes                                                                      Hint

// =================================================================================================================================
// CONTROLLER ======================================================================================================================

#define PRODUCT_DESCRIPTION "JTW Trident $model (MANTICORE) $options"

// WIFI Configuration - The Manticore serves WIFI from the main controller ------------------------------
#define AP_ENABLED            $ap_enabled //
#define AP_SSID                "$ap_ssid" // set WiFi SSID name
#define AP_PASSWORD          "$ap_password" //  "password", Wifi Access Point password.                                         Adjust
#define AP_CHANNEL                      7 //           7, Wifi Access Point channel.                                          Adjust
#define AP_IP_ADDR          $ap_wifi_ip // ..,168,0,1}, Wifi Access Point IP Address.                                       Adjust
#define AP_GW_ADDR          $ap_wifi_ip // ..,168,0,1}, Wifi Access Point GATEWAY Address.                                  Adjust
#define AP_SN_MASK        $ap_wifi_mask // ..55,255,0}, Wifi Access Point SUBNET Mask.                                      Adjust
#define STA_ENABLED         $sta_enabled //       false, Wifi Station Enabled.                                               Adjust
#define STA_SSID               "$sta_ssid" //      "Home", Wifi Station SSID to connnect to.                                   Adjust
#define STA_PASSWORD       "$sta_password" //  "password", Wifi Station mode password.                                         Adjust
#define STA_DHCP_ENABLED            $wifi_dhcp //       false, Wifi Station/Ethernet DHCP Enabled.                                 Adjust
#define STA_IP_ADDR         $sta_wifi_ip // ..168,1,55}, Wifi Station/Ethernet IP Address.                                   Adjust
#define STA_GW_ADDR         $sta_wifi_gw // ..,168,1,1}, Wifi Station/Ethernet GATEWAY Address.                              Adjust
#define STA_SN_MASK       $sta_wifi_mask // ..55,255,0}, Wifi Station/Ethernet SUBNET Mask.                                  Adjust
#define MDNS_SERVER                   $mdns_server
#define HOST_NAME           "OnStepXWifi" // nStep", Hostname for this device up to 16 chars.                                 Adjust
// Website Plugin configuration - the SWS in WIFI mode -------------------------------------------------
#define DISPLAY_LANGUAGE             L_en //   L_en, English. Or L_ce, L_de, L_en, L_us, L_es two letter country code.        Adjust
#define DISPLAY_WEATHER                $weather // website, display weather
#define DISPLAY_INTERNAL_TEMPERATURE   $temp // website, display internal MCU temperature
#define DISPLAY_WIFI_SIGNAL_STRENGTH   $display_wifi_signal // website, display wifi signal strength (wifi only)
#define DISPLAY_RESET_CONTROLS         ON //    OFF, ON allows reset if supported, FWU for STM32 firmware upload pin HIGH.    Option
#define DISPLAY_COORDINATE_ORIGIN      $origin //    OFF, ON to display the coordinate origin control tile on the mount page.      Option
#define DISPLAY_SERVO_MONITOR          $monitor // website, display servo monitor
//#define DISPLAY_STALLGUARD_MONITOR     $monitor //    OFF, ON to display the StallGuard monitor for OnStepX (any axis.)             Option
#define HOME_SWITCH_DIRECTION_CONTROL  $home_switch // website, display home switch reversal
#define DISPLAY_HIGH_PRECISION_COORDS  $display_high_precision //


// PINMAP ------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Controller#PINMAP
#define PINMAP                  MANTICORE //    OFF, Choose from: MiniPCB, MiniPCB2, MaxPCB2, MaxESP3, CNC3, STM32Blue,      <-Req'd
#define GPIO_DEVICE SWS                   // activate external GPIO device on SWS

// SERIAL PORT COMMAND CHANNELS --------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Controller#SERIAL_PORTS
#define SERIAL_A_BAUD_DEFAULT      230400 //   9600, n. Where n=9600,19200,57600,115200,230400,460800 (common baud rates.)    Infreq
#define SERIAL_B_BAUD_DEFAULT      921600 //   9600, n. Baud rate as above. See (src/pinmaps/) for Serial port assignments.   Option
#define SERIAL_B_ESP_FLASHING         OFF //    OFF, ON Upload ESP8266 WiFi firmware through SERIAL_B with :ESPFLASH# cmd.    Option
#define SERIAL_C_BAUD_DEFAULT         OFF //    OFF, n. Baud rate as above. See (src/pinmaps/) for Serial port assignments.   Infreq
#define SERIAL_D_BAUD_DEFAULT         OFF //    OFF, n. Baud rate as above. See (src/pinmaps/) for Serial port assignments.   Infreq
#define SERIAL_E_BAUD_DEFAULT         OFF //    OFF, n. Baud rate as above. See (src/pinmaps/) for Serial port assignments.   Infreq
#define SERIAL_RADIO    $wifi_mode //    OFF, Use BLUETOOTH or WIFI_ACCESS_POINT or WIFI_STATION (ESP32 only.)         Option

// STATUS --------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Controller#STATUS_LED
#define STATUS_LED                     ON //    OFF, Steady illumination if no error, blinks w/error code otherwise.          Option

// RETICLE CONTROL ------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Controller#RETICLE_CONTROL
#define RETICLE_LED_DEFAULT           OFF //    OFF, n. Where n=0..255 (0..100%) activates feature sets default brightness.   Option
#define RETICLE_LED_MEMORY            OFF //    OFF, ON Remember reticle brightness across power cycles.                      Option
#define RETICLE_LED_INVERT            OFF //    OFF, ON Inverts control for cases where 0V is max brightness.                 Option

// WEATHER SENSOR --------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Controller#WEATHER_SENSOR
#define WEATHER               $weather_mode //    OFF, BME280 (I2C 0x77,) BME280_0x76, BME280_SPI (see pinmap for CS.)          Option

// SIGNALING ------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Controller#SIGNALING
#define STEP_WAVE_FORM              PULSE // SQUARE, PULSE Step signal wave form faster rates. SQUARE best signal integrity.  Adjust

// NON-VOLATILE MEMORY --------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#NV
#define NV_DRIVER             $nv_driver // NV_DEF, Use platforms default non-volatile device to remember runtime settings.  Option

// =================================================================================================================================
// MOUNT ===========================================================================================================================
#define DRIVER_TMC_STEPPER                // use TMCStepper library
/*#define DRIVER_TMC_STEPPER_STALLGUARD
#define SG_ENABLED ON
#define SG_TRAIN OFF
#define SG_FLOOR 20
#define SG_RAMP_ALLOW 40
#define SG_SENS 50
#define SG_ARM_FPS 150
#define SG_FAULT_MS 200 */

// ------------------------------------------------------------------------------------------------------------
// AXIS1 RA/AZM -------------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Axes
// AXIS1_COUNTS_PER_DEGREE drives AxisSettings/GOTO/limits math and must be the real encoder resolution.
// For SERVO_TMC2209, AXIS1_STEPS_PER_DEGREE is used only to derive countsToStepsRatio (Mount.axis.cpp: AXIS1_STEPS_PER_DEGREE/AXIS1_COUNTS_PER_DEGREE)
// so it must be the physical motor's real microstep resolution, not the encoder value, or the ratio comes out as 1.0 instead of ~0.549335.
                                          //         n = (stepper_steps * micro_steps * overall_gear_reduction)/360.0
#define AXIS1_ENCODER          $encoder
#define AXIS1_ENCODER_REVERSE          $axis1_encoder_reverse //
#define AXIS1_COUNTS_PER_DEGREE      $encoder_count
#define AXIS1_STEPS_PER_DEGREE      25600 // 
#define AXIS1_TARGET_TOLERANCE        5.0 // in arc-seconds
#define AXIS1_SERVO_ACCELERATION      $axis1_servo_acceleration // acceleration, in %/s of AXIS1_SERVO_VELOCITY_MAX
#define AXIS1_SERVO_VELOCITY_PWMTHRS ((AXIS1_STEPS_PER_DEGREE*3)/240) // in 256x steps per second
#define AXIS1_SERVO_FLTR           $axis1_servo_fltr 
#define AXIS1_SERVO_FLTR_MEAS_U         $axis1_servo_fltr_meas_u
#define AXIS1_SERVO_FLTR_VARIANCE    $axis1_servo_fltr_variance
#define AXIS1_SERVO_FLTR_WSIZE      $axis1_servo_fltr_wsize // rolling filter window size
#define AXIS1_PID_SENSITIVITY           $axis1_pid_sensitivity // in % power to using 100% of pid set two (_GOTO)
#define AXIS1_PID_P                   $axis1_pid_p // P = proportional
#define AXIS1_PID_I                   $axis1_pid_i // I = integral
#define AXIS1_PID_D                   $axis1_pid_d // D = derivative
#define AXIS1_PID_P_GOTO              $axis1_pid_p_goto // P = proportional
#define AXIS1_PID_I_GOTO              $axis1_pid_i_goto // I = integral
#define AXIS1_PID_D_GOTO              $axis1_pid_d_goto // D = derivative

#define AXIS1_DRIVER_MODEL  $driver //    OFF, Enter motor driver model (above) in both axes to activate the mount.    <-Often
#define AXIS1_REVERSE                 $axis1_reverse //    OFF, ON Reverses movement direction, or reverse wiring instead to correct.   <-Often
#define AXIS1_LIMIT_MIN              -180 //   -180, n. Where n= -90..-360 (degrees.) Minimum "Hour Angle" or Azimuth.        Adjust
#define AXIS1_LIMIT_MAX               180 //    180, n. Where n=  90.. 360 (degrees.) Maximum "Hour Angle" or Azimuth.        Adjust
#define AXIS1_DRIVER_MICROSTEPS       $axis1_microsteps //    OFF, n. Microstep mode when tracking.                                        <-Req'd
#define AXIS1_DRIVER_MICROSTEPS_GOTO  $axis1_microsteps_goto //    OFF, n. Microstep mode used during slews. OFF uses _DRIVER_MICROSTEPS.        Option
#define AXIS1_DRIVER_IHOLD           1000 //    OFF, n, (mA.) Current during standstill. OFF uses IRUN/2.0                    Option
#define AXIS1_DRIVER_IRUN            1000 //    OFF, n, (mA.) Current during tracking, appropriate for stepper/driver/etc.    Option
#define AXIS1_DRIVER_IGOTO            $axis1_igoto //    OFF, n, (mA.) Current during slews. OFF uses IRUN.                            Option
#define AXIS1_DRIVER_STATUS            ON //    OFF, ON, HIGH, or LOW.  For driver status info/fault detection.               Option
#define AXIS1_DRIVER_DECAY      STEALTHCHOP //  OFF, Tracking decay mode default override. TMC default is STEALTHCHOP.        Infreq
#define AXIS1_DRIVER_DECAY_GOTO STEALTHCHOP //  OFF, Decay mode goto default override. TMC default is SPREADCYCLE.            Infreq
#define AXIS1_POWER_DOWN              OFF //    OFF, ON Powers off 30sec after movement stops or 10min after last<=1x guide.  Infreq
#define AXIS1_SENSE_HOME              $home_sense //    OFF, HIGH or LOW enables & state clockwise home position, as seen from front. Option
#define HOME_OFFSET_RANGE_AXIS1    $home_range_axis1 //    7200, allow adjusting home offset up to +/- 2 degrees                         Infreq
#define AXIS1_SENSE_LIMIT_MIN LIMIT_SENSE // ...NSE, HIGH or LOW state on limit sense switch stops movement.                  Option
#define AXIS1_SENSE_LIMIT_MAX LIMIT_SENSE // ...NSE, HIGH or LOW state on limit sense switch stops movement.                  Option

// AXIS2 DEC/ALT ------------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Axes
// AXIS2_COUNTS_PER_DEGREE drives AxisSettings/GOTO/limits math and must be the real encoder resolution.
// For SERVO_TMC2209, AXIS2_STEPS_PER_DEGREE is used only to derive countsToStepsRatio (Mount.axis.cpp: AXIS2_STEPS_PER_DEGREE/AXIS2_COUNTS_PER_DEGREE)
// so it must be the physical motor's real microstep resolution, not the encoder value, or the ratio comes out as 1.0 instead of ~0.549335.
                                          //         n = (stepper_steps * micro_steps * overall_gear_reduction)/360.0
#define AXIS2_ENCODER           $encoder
#define AXIS2_ENCODER_REVERSE          $axis2_encoder_reverse //
#define AXIS2_COUNTS_PER_DEGREE      $encoder_count
#define AXIS2_STEPS_PER_DEGREE      25600 // 
#define AXIS2_TARGET_TOLERANCE        5.0 // in arc-seconds
#define AXIS2_SERVO_ACCELERATION      $axis2_servo_acceleration // acceleration, in %/s of AXIS1_SERVO_VELOCITY_MAX
#define AXIS2_SERVO_VELOCITY_PWMTHRS ((AXIS2_COUNTS_PER_DEGREE*3)/240) // in 256x steps per second
#define AXIS2_SERVO_FLTR           $axis2_servo_fltr 
#define AXIS2_SERVO_FLTR_MEAS_U         $axis2_servo_fltr_meas_u
#define AXIS2_SERVO_FLTR_VARIANCE    $axis2_servo_fltr_variance
#define AXIS2_SERVO_FLTR_WSIZE      $axis2_servo_fltr_wsize // rolling filter window size
#define AXIS2_PID_SENSITIVITY           $axis2_pid_sensitivity // in % power to using 100% of pid set two (_GOTO)
#define AXIS2_PID_P                   $axis2_pid_p // P = proportional
#define AXIS2_PID_I                   $axis2_pid_i // I = integral
#define AXIS2_PID_D                   $axis2_pid_d // D = derivative
#define AXIS2_PID_P_GOTO              $axis2_pid_p_goto // P = proportional
#define AXIS2_PID_I_GOTO              $axis2_pid_i_goto // I = integral
#define AXIS2_PID_D_GOTO              $axis2_pid_d_goto // D = derivative

#define AXIS2_DRIVER_MODEL  $driver //    OFF, Enter motor driver model (above) in both axes to activate the mount.    <-Often
#define AXIS2_REVERSE                 $axis2_reverse //    OFF, ON Reverses movement direction, or reverse wiring instead to correct.   <-Often
#define AXIS2_LIMIT_MIN               -90 //    -90, n. Where n=-90..0 (degrees.) Minimum allowed Declination or Altitude.    Infreq
#define AXIS2_LIMIT_MAX                90 //     90, n. Where n=0..90 (degrees.) Maximum allowed Declination or Altitude.     Infreq
#define AXIS2_DRIVER_MICROSTEPS       $axis2_microsteps //    OFF, n. Microstep mode when tracking.                                        <-Req'd
#define AXIS2_DRIVER_MICROSTEPS_GOTO  $axis2_microsteps_goto //    OFF, n. Microstep mode used during slews. OFF uses _DRIVER_MICROSTEPS.        Option
#define AXIS2_DRIVER_IHOLD           1000 //    OFF, n, (mA.) Current during standstill. OFF uses IRUN/2.0                    Option
#define AXIS2_DRIVER_IRUN            1000 //    OFF, n, (mA.) Current during tracking, appropriate for stepper/driver/etc.    Option
#define AXIS2_DRIVER_IGOTO            $axis2_igoto //    OFF, n, (mA.) Current during slews. OFF uses IRUN.                            Option
#define AXIS2_DRIVER_STATUS            ON //    OFF, ON, HIGH, or LOW.  Polling for driver status info/fault detection.       Option
#define AXIS2_DRIVER_DECAY      STEALTHCHOP //  OFF, Tracking decay mode default override. TMC default is STEALTHCHOP.        Infreq
#define AXIS2_DRIVER_DECAY_GOTO STEALTHCHOP //  OFF, Decay mode goto default override. TMC default is SPREADCYCLE.            Infreq
#define AXIS2_POWER_DOWN              OFF //    OFF, ON Powers off 30sec after movement stops or 10min after last<=1x guide.  Option
#define AXIS2_SENSE_HOME              $home_sense //    OFF, HIGH or LOW enables & state clockwise home position, as seen from above. Option
#define HOME_OFFSET_RANGE_AXIS2    $home_range_axis2 //    7200, allow adjusting home offset up to +/- 2 degrees                         Infreq
#define AXIS2_SENSE_LIMIT_MIN LIMIT_SENSE // ...NSE, HIGH or LOW state on limit sense switch stops movement.                  Option
#define AXIS2_SENSE_LIMIT_MAX LIMIT_SENSE // ...NSE, HIGH or LOW state on limit sense switch stops movement.                  Option

// MOUNT -------------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#MOUNT
#define MOUNT_TYPE                    GEM //    GEM, GEM         German Equatorial Mount, etc. that need meridian flips.     <-Req'd
#define MOUNT_COORDS          TOPOCENTRIC // ...RIC, Applies refraction to coordinates to/from OnStep, except exactly         Infreq
#define MOUNT_COORDS_MEMORY           $mount_coords_memory //    OFF, ON Remembers approximate mount coordinates across power cycles.          Option
#define MOUNT_ENABLE_IN_STANDBY       $mount_enable_in_standby //    OFF, ON Enables mount motor drivers while in standby.                         Infreq

// TIME AND LOCATION ---------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#TLS
#define TIME_LOCATION_SOURCE       $tls //    OFF, DS3231 (I2C,) SD3031 (I2C,) TEENSY (T3.2 etc,) GPS, or NTP source.       Option
#define TIME_IP_ADDR     $time_ip_addr  // time-a-g.nist.gov
#define TIME_LOCATION_PPS_SENSE       $pps_detect //    OFF, HIGH senses PPS (pulse per second,) signal rising edge, or use LOW for   Option
#define TIME_LOCATION_PPS_SYNC        OFF // 
#define TIME_LOCATION_SOURCE_FALLBACK $tls_fallback // OFF, alternate TLS, must be differnet than above and not GPS or NTP           Option

// STATUS ------------------------------------------------------ see https://onstep.groups.io/g/main/wiki/Configuration_Mount#STATUS
#define STATUS_MOUNT_LED               ON //    OFF, ON Flashes proportional to rate of movement or solid on for slews.       Option
#define STATUS_BUZZER                2000 //    OFF, ON, n. Where n=100..6000 (Hz freq.) for speaker. ON for piezo buzzer.    Option
#define STATUS_BUZZER_DEFAULT         $status_buzzer_default //    OFF, ON default starts w/buzzer enabled.                                      Option
#define STATUS_BUZZER_MEMORY           $status_buzzer_memory //    OFF, ON to remember buzzer setting across power cycles.                       Option

// ST4 INTERFACE -------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#ST4
#define ST4_INTERFACE                  $st4_interface //    OFF, ON enables interface. <= 1X guides unless hand control mode.             Option
#define ST4_HAND_CONTROL               $st4_hand_control //     ON, ON for hand controller special features and SHC support.                 Option
#define ST4_HAND_CONTROL_FOCUSER       $st4_hand_control_focuser //     ON, ON alternate to above: Focuser move [E]f1 [W]f2 [N]-     [S]+            Option

// GUIDING BEHAVIOUR ------------------------------------------ see https://onstep.groups.io/g/main/wiki/Configuration_Mount#GUIDING
#define GUIDE_TIME_LIMIT                0 //     10, n. Time limit n=0..120 seconds. Use 0 to disable.                        Adjust
#define GUIDE_DISABLE_BACKLASH         ON //    OFF, Disable backlash takeup during guiding at <= 1X.                         Option

// LIMITS ------------------------------------------------------ see https://onstep.groups.io/g/main/wiki/Configuration_Mount#LIMITS
#define LIMIT_SENSE                   $limit_sense //    OFF, HIGH or LOW state on limit sense switch stops movement.                  Option

// PARKING ---------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#PARKING
#define PARK_SENSE                    $park_sense //    OFF, HIGH or LOW state indicates mount is in the park orientation.            Option
#define PARK_SIGNAL                   $park_signal //    OFF, HIGH or LOW state park input signal triggers parking.                    Option
#define PARK_STATUS                   $park_status //    OFF, signals with a HIGH or LOW state when successfully parked.               Option 
#define PARK_STRICT                   $park_strict //    OFF, ON Un-parking is only allowed if successfully parked.                    Option

// PEC ------------------------------------------------------------ see https://onstep.groups.io/g/main/wiki/Configuration_Mount#PEC
#define PEC_STEPS_PER_WORM_ROTATION     $pec_spwr //     0, n. Steps per worm rotation (0 disables else 720 sec buffer allocated.)  <-Req'd
#define PEC_SENSE $pec_sense //    OFF, HIGH. Senses the PEC signal rising edge or use LOW for falling edge.     Option
#define PEC_BUFFER_SIZE_LIMIT         960 //    720, Seconds of PEC buffer allowed.                                           Infreq

// TRACKING BEHAVIOUR ---------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#TRACKING
#define TRACK_BACKLASH_RATE            20 //     20, n. Where n=2..50 (x sidereal rate) during backlash takeup.               Option
#define TRACK_AUTOSTART               OFF //    OFF, ON Start with tracking enabled.                                          Option
#define TRACK_COMPENSATION_DEFAULT    $compensation //    OFF, No compensation or REFRACTION, REFRACTION_DUAL, MODEL, MODEL_DUAL.       Option
#define TRACK_COMPENSATION_MEMORY      ON //    OFF, ON Remembers refraction/pointing model compensated tracking settings.    Option

// SLEWING BEHAVIOUR ------------------------------------------ see https://onstep.groups.io/g/main/wiki/Configuration_Mount#SLEWING
#define SLEW_RATE_BASE_DESIRED       3.00 //    1.0, n. Desired slew rate in deg/sec. Adjustable at run-time from            <-Req'd
#define SLEW_RATE_MEMORY               $slew_rate_memory //    OFF, ON Remembers rates set across power cycles.                              Option
#define SLEW_ACCELERATION_DIST       10.0 //    5.0, n, (degrees.) Approx. distance for acceleration (and deceleration.)      Adjust
#define SLEW_RAPID_STOP_DIST          2.5 //    2.0, n, (degrees.) Approx. distance required to stop when a slew              Adjust

#define GOTO_FEATURE                   $goto_feature //     ON, Use OFF to disable mount Goto features.                                  Infreq
#define GOTO_OFFSET                   0.0 //   0.25, Offset in deg's for goto target unidirectional approach, 0.0 disables    Adjust
#define GOTO_OFFSET_ALIGN             OFF //    OFF, ON skips final phase of goto for align stars so user tends to approach   Option
#define GOTO_REFINE_STAGES              0 //         Stages to added to goto for final target coordinate update from encoders Option
#define GOTO_SETTLE_TIME             1000 //         Time to wait for servo positions to settle, in milliseconds              Option

// PIER SIDE BEHAVIOUR --------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#PIERSIDE
#define MFLIP_SKIP_HOME                $mflip_skip_home //    OFF, ON Goto directly to the destination without visiting home position.      Option
#define MFLIP_AUTOMATIC_DEFAULT        $mflip_automatic_default //    OFF, ON Start with automatic meridian flips enabled.                          Option
#define MFLIP_AUTOMATIC_MEMORY         $mflip_automatic_memory //    OFF, ON Remember automatic meridian flip setting across power cycles.         Option
#define MFLIP_PAUSE_HOME_DEFAULT      $mflip_pause_home_default //    OFF, ON Start with meridian flip pause at home enabed.                        Infreq
#define MFLIP_PAUSE_HOME_MEMORY        $mflip_pause_home_memory //    OFF, ON Remember meridian flip pause at home setting across power cycles.     Infreq

#define PIER_SIDE_SYNC_CHANGE_SIDES   $pier_side_sync_change_sides //    OFF, ON Allows sync to change pier side, for GEM mounts.                      Option
#define PIER_SIDE_PREFERRED_DEFAULT  $pier_side_preferred_default //   BEST, BEST Stays on current side if possible. EAST or WEST switch if possible. Option
#define PIER_SIDE_PREFERRED_MEMORY     $pier_side_preferred_memory //    OFF, ON Remember preferred pier side setting across power cycles.             Option

// ALIGN -------------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Mount#ALIGN
#define ALIGN_AUTO_HOME               $align_auto_home //    OFF, ON uses home switches to find home first when starting an align.         Option
#define ALIGN_MODEL_MEMORY             $align_model_memory //    OFF, ON Restores any pointing model saved in NV at startup.                   Option
#define ALIGN_MAX_STARS              $align_max_stars //   AUTO, Uses HAL specified default (either 6 or 9 stars.)                        Infreq
                                          //         Or use n. Where n=1 (for Sync only) or 3 to 9 (for Goto Assist.)

// =================================================================================================================================
// ROTATOR =========================================================================================================================

// AXIS3 ROTATOR ---------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Rotator
#define AXIS3_DRIVER_MODEL            OFF //    OFF, Enter motor driver model (above) to activate the rotator.                Option
#define AXIS3_SLEW_RATE_BASE_DESIRED  1.0 //    1.0, n. Desired slew rate in deg/sec. Adjustable at run-time from            <-Req'd
#define AXIS3_STEPS_PER_DEGREE       64.0 //   64.0, n. Number of steps per degree for rotator/de-rotator.                    Adjust
#define AXIS3_REVERSE                 OFF //    OFF, ON Reverses movement direction, or reverse wiring instead to correct.    Option
#define AXIS3_LIMIT_MIN                 0 //      0, n. Where n=-360..0 (degrees.) Minimum allowed rotator angle.             Infreq
#define AXIS3_LIMIT_MAX               360 //    360, n. Where n=0..360 (degrees.) Maximum allowed rotator angle.              Infreq
#define AXIS3_DRIVER_MICROSTEPS       OFF //    OFF, n. Microstep mode when tracking.                                         Option
#define AXIS3_DRIVER_MICROSTEPS_GOTO  OFF //    OFF, n. Microstep mode used during slews. OFF uses _DRIVER_MICROSTEPS.        Option
#define AXIS3_DRIVER_IHOLD            OFF //    OFF, n, (mA.) Current during standstill. OFF uses IRUN/2.0                    Option
#define AXIS3_DRIVER_IRUN             OFF //    OFF, n, (mA.) Current during tracking, appropriate for stepper/driver/etc.    Option
#define AXIS3_DRIVER_IGOTO            OFF //    OFF, n, (mA.) Current during slews. OFF uses IRUN.                            Option
#define AXIS3_DRIVER_STATUS           OFF //    OFF, ON, HIGH, or LOW.  For driver status info/fault detection.               Option
#define AXIS3_DRIVER_DECAY            OFF //    OFF, Tracking decay mode default override. TMC default is STEALTHCHOP.        Infreq
#define AXIS3_DRIVER_DECAY_GOTO       OFF //    OFF, Decay mode goto default override. TMC default is SPREADCYCLE.            Infreq
#define AXIS3_POWER_DOWN              OFF //    OFF, ON Powers off 30 seconds after movement stops.                           Option
#define AXIS3_SENSE_HOME              OFF //    OFF, HIGH or LOW enables & state clockwise home position, as seen from above. Option
#define AXIS3_SENSE_LIMIT_MIN         OFF //    OFF, HIGH or LOW state on limit sense switch stops movement.                  Option
#define AXIS3_SENSE_LIMIT_MAX         OFF //    OFF, HIGH or LOW state on limit sense switch stops movement.                  Option

// =================================================================================================================================
// FOCUSERS ========================================================================================================================

// AXIS4 FOCUSER 1 -------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Focuser
#define AXIS4_DRIVER_MODEL            OFF //    OFF, Enter motor driver model (above) to activate the focuser.                Option
#define AXIS4_SLEW_RATE_BASE_DESIRED  300 //    500, n, Where n=200..5000 (um/s.) Adjustable at run-time from                <-Req'd
#define AXIS4_SLEW_RATE_MINIMUM        20 //     20, n. Where n=5..200 (um/s.) Minimum microns/second.                        Adjust
#define AXIS4_STEPS_PER_MICRON        0.5 //    0.5, n. Steps per micrometer. Figure this out by testing or other means.      Adjust
#define AXIS4_REVERSE                 OFF //    OFF, ON Reverses movement direction, or reverse wiring instead to correct.    Option
#define AXIS4_LIMIT_MIN                 0 //      0, n. Where n=0..500 (millimeters.) Minimum allowed position.               Adjust
#define AXIS4_LIMIT_MAX                50 //     50, n. Where n=0..500 (millimeters.) Maximum allowed position.               Adjust
#define AXIS4_DRIVER_MICROSTEPS       OFF //    OFF, n. Microstep mode when tracking.                                         Option
#define AXIS4_DRIVER_MICROSTEPS_GOTO  OFF //    OFF, n. Microstep mode used during slews. OFF uses _DRIVER_MICROSTEPS.        Option
#define AXIS4_DRIVER_IHOLD            OFF //    OFF, n, (mA.) Current during standstill. OFF uses IRUN/2.0                    Option
#define AXIS4_DRIVER_IRUN             OFF //    OFF, n, (mA.) Current during tracking, appropriate for stepper/driver/etc.    Option
#define AXIS4_DRIVER_IGOTO            OFF //    OFF, n, (mA.) Current during slews. OFF uses IRUN.                            Option
#define AXIS4_DRIVER_STATUS           OFF //    OFF, ON, HIGH, or LOW.  For driver status info/fault detection.               Option
#define AXIS4_DRIVER_DECAY            OFF //    OFF, Tracking decay mode default override. TMC default is STEALTHCHOP.        Infreq
#define AXIS4_DRIVER_DECAY_GOTO       OFF //    OFF, Decay mode goto default override. TMC default is SPREADCYCLE.            Infreq
#define AXIS4_POWER_DOWN              OFF //    OFF, ON Powers off 30 seconds after movement stops.                           Option
#define AXIS4_SENSE_HOME              OFF //    OFF, HIGH or LOW enables & state clockwise home position, as seen from above. Option
#define AXIS4_SENSE_LIMIT_MIN         OFF //    OFF, HIGH or LOW state on limit sense switch stops movement.                  Option
#define AXIS4_SENSE_LIMIT_MAX         OFF //    OFF, HIGH or LOW state on limit sense switch stops movement.                  Option

// AXIS5 FOCUSER 2 -----------------------------------------------------------------------------------------------------------------
// Up to 6 focusers can be present (AXIS4 to AXIS9) simply copy the above text for focuser 1 and rename to AXIS5_ for focuser 2, etc
// FOCUSER TEMPERATURE ---------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Focuser
#define FOCUSER_TEMPERATURE           OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n for focuser temp.            Adjust

// =================================================================================================================================
// AUXILIARY FEATURES ==============================================================================================================

// FEATURES ------------------------------------------------------------- see https://onstep.groups.io/g/main/wiki/Configuration_Aux
// Note: Temporarily set DEBUG mode to VERBOSE and use "FEATURE1_TEMP DS1820" to list the DS18B20 device serial numbers.

#define FEATURE1_PURPOSE       ANALOG_OUT //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE1_NAME             "LAMP1" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE1_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE1_PIN          GPIO_PIN(2) //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE1_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE1_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

#define FEATURE2_PURPOSE       ANALOG_OUT //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE2_NAME             "LAMP2" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE2_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE2_PIN          GPIO_PIN(3) //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE2_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE2_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

#define FEATURE3_PURPOSE              OFF //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE3_NAME          "FEATURE3" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE3_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE3_PIN                  OFF //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE3_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE3_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

#define FEATURE4_PURPOSE              OFF //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE4_NAME          "FEATURE4" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE4_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE4_PIN                  OFF //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE4_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE4_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

#define FEATURE5_PURPOSE              OFF //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE5_NAME          "FEATURE5" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE5_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE5_PIN                  OFF //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE5_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE5_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

#define FEATURE6_PURPOSE              OFF //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE6_NAME          "FEATURE6" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE6_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE6_PIN                  OFF //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE6_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE6_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

#define FEATURE7_PURPOSE              OFF //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE7_NAME          "FEATURE7" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE7_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE7_PIN                  OFF //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE7_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE7_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

#define FEATURE8_PURPOSE              OFF //    OFF, SWITCH, MOMENTARY_SWITCH, ANALOG_OUT, DEW_HEATER, INTERVALOMETER.        Option
#define FEATURE8_NAME          "FEATURE8" // "FE..", Name of feature being controlled.                                        Adjust
#define FEATURE8_TEMP                 OFF //    OFF, THERMISTOR or n. Where n is the ds18b20 s/n. For DEW_HEATER temperature. Adjust
#define FEATURE8_PIN                  OFF //    OFF, AUX for auxiliary pin, n. Where n is the pin#.                           Adjust
#define FEATURE8_VALUE_DEFAULT        OFF //    OFF, ON, n. Where n=0..255 for ANALOG_OUT purpose.                            Adjust
#define FEATURE8_ON_STATE            HIGH //   HIGH, LOW to invert so "ON" is 0V and "OFF" is Vcc (3.3V usually.)             Adjust

// ---------------------------------------------------------------------------------------------------------------------------------
#define FileVersionConfig 6
#include "Extended.config.h"
