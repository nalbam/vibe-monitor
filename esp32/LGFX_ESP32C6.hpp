/*
 * LovyanGFX configuration for ESP32-C6 LCD boards
 * Supports:
 *   BOARD_1_47 — ESP32-C6-LCD-1.47  ST7789V2 172x320 (GPIO22 PWM backlight)
 *   BOARD_1_9  — ESP32-C6-LCD-1.9   ST7789V2 170x320 (GPIO15 direct backlight, active-low)
 */

#ifndef LGFX_ESP32C6_HPP
#define LGFX_ESP32C6_HPP

#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include "config.h"

class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_ST7789 _panel_instance;
  lgfx::Bus_SPI      _bus_instance;
  lgfx::Light_PWM    _light_instance;

public:
  LGFX(void) {}  // Deferred: call configure(boardType) before init()

  void configure(int boardType) {
    // --- SPI bus ---
    {
      auto cfg = _bus_instance.config();
      cfg.spi_host     = SPI2_HOST;
      cfg.spi_mode     = 0;
      cfg.freq_write   = (boardType == BOARD_1_9) ? 20000000 : 40000000;
      cfg.freq_read    = 16000000;
      cfg.spi_3wire    = false;
      cfg.use_lock     = true;
      cfg.dma_channel  = SPI_DMA_CH_AUTO;
      cfg.pin_miso     = -1;

      if (boardType == BOARD_1_9) {
        cfg.pin_sclk = 5;
        cfg.pin_mosi = 4;
        cfg.pin_dc   = 6;
      } else {  // BOARD_1_47 (default)
        cfg.pin_sclk = 7;
        cfg.pin_mosi = 6;
        cfg.pin_dc   = 15;
      }

      _bus_instance.config(cfg);
      _panel_instance.setBus(&_bus_instance);
    }

    // --- Panel ---
    {
      auto cfg = _panel_instance.config();
      cfg.pin_busy         = -1;
      cfg.dummy_read_pixel = 8;
      cfg.dummy_read_bits  = 1;
      cfg.readable         = true;
      cfg.invert           = true;
      cfg.rgb_order        = false;
      cfg.dlen_16bit       = false;
      cfg.bus_shared       = false;
      cfg.panel_height     = 320;
      cfg.offset_y         = 0;
      cfg.offset_rotation  = 0;

      if (boardType == BOARD_1_9) {
        cfg.pin_cs      = 7;
        cfg.pin_rst     = 14;
        cfg.panel_width = 170;
        cfg.offset_x    = 35;
      } else {  // BOARD_1_47 (default)
        cfg.pin_cs      = 14;
        cfg.pin_rst     = 21;
        cfg.panel_width = 172;
        cfg.offset_x    = 34;
      }

      _panel_instance.config(cfg);
    }

    // --- Backlight (1.47" only — 1.9" uses direct GPIO15, handled in initBacklight()) ---
    if (boardType == BOARD_1_47) {
      auto cfg = _light_instance.config();
      cfg.pin_bl      = 22;
      cfg.invert      = false;
      cfg.freq        = 44100;
      cfg.pwm_channel = 0;
      _light_instance.config(cfg);
      _panel_instance.setLight(&_light_instance);
    }

    setPanel(&_panel_instance);
  }
};

#endif // LGFX_ESP32C6_HPP
