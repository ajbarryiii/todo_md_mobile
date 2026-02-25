{
  description = "Nix flake for the Todo mobile (React Native iOS) app";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      forAllSystems = f:
        nixpkgs.lib.genAttrs systems (system:
          f (import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          }));
    in
    {
      packages = forAllSystems (pkgs: {
        default = pkgs.buildEnv {
          name = "todo-mobile-build-deps";
          paths = with pkgs; [
            nodejs_22
            pnpm
            ruby_3_3
            rubyPackages_3_3.bundler
            cocoapods
            watchman
            git
            jq
          ];
        };
      });

      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            pnpm
            ruby_3_3
            rubyPackages_3_3.bundler
            cocoapods
            watchman
            jdk17
            git
            jq
          ];

          shellHook = ''
            export BUNDLE_PATH="$PWD/.bundle"
            export BUNDLE_JOBS=4
            export LC_ALL=en_US.UTF-8
            export LANG=en_US.UTF-8

            if [ -d "../todo_md" ]; then
              export TODO_MD_PATH="$(realpath ../todo_md)"
            fi

            cat <<'EOF'
            Todo mobile dev shell (iOS target):
              - React Native toolchain (Node, pnpm, Ruby, CocoaPods, Watchman)
              - Uniwind + HeroUI compatible JS/CSS tooling baseline
              - Markdown DB source path available as $TODO_MD_PATH (when ../todo_md exists)

            Notes:
              - Xcode and iOS Simulator are provided by macOS, not Nix.
              - Run: pnpm install
              - Then: bundle exec pod install --project-directory=ios
              - Then: pnpm ios
            EOF
          '';
        };
      });

      formatter = forAllSystems (pkgs: pkgs.nixpkgs-fmt);
    };
}
