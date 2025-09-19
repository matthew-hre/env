{
  mkShell,
  alejandra,
  nodejs_23,
  pnpm,
}:
mkShell {
  name = "@matthew-hre/env";

  packages = [
    nodejs_23
    pnpm
    alejandra
  ];
}
