#!/usr/bin/env node

const args = process.argv.slice(2);

function readArg(name) {
  const i = args.indexOf(name);
  if (i === -1 || i === args.length - 1) {
    return undefined;
  }
  return args[i + 1];
}

function required(name) {
  const value = readArg(name);
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

try {
  const owner = required("--owner");
  const repo = readArg("--repo") ?? "bostadcli";
  const version = required("--version");
  const macosArm64Sha = required("--macos-arm64-sha");
  const macosX64Sha = required("--macos-x64-sha");

  const formula = `class Bostadcli < Formula
  desc "CLI for fetching apartments from bostad.stockholm.se"
  homepage "https://github.com/${owner}/${repo}"
  version "${version}"

  on_macos do
    on_arm do
      url "https://github.com/${owner}/${repo}/releases/download/v${version}/bostadcli_${version}_macos_arm64.tar.gz"
      sha256 "${macosArm64Sha}"
    end

    on_intel do
      url "https://github.com/${owner}/${repo}/releases/download/v${version}/bostadcli_${version}_macos_x64.tar.gz"
      sha256 "${macosX64Sha}"
    end
  end

  def install
    bin.install "bostad"
  end

  test do
    output = shell_output("#{bin}/bostad --help")
    assert_match "Usage:", output
  end
end
`;

  process.stdout.write(formula);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
