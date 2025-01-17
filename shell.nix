let
  pkgs = import <nixpkgs> { };
in
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    pkg-config
    gobject-introspection
    cargo
    cargo-tauri
    nodejs
    rustc
  ];

  buildInputs = with pkgs;[
    at-spi2-atk
    atkmm
    cairo
    gdk-pixbuf
    glib
    gtk3
    harfbuzz
    librsvg
    libsoup_3
    pango
    webkitgtk_4_1
    openssl
  ];

  shellHook = ''
    export GIO_MODULE_DIR=${pkgs.glib-networking}/lib/gio/modules/
    alias start='WEBKIT_DISABLE_DMABUF_RENDERER=1 cargo-tauri dev'
  '';
}
