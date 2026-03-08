class Bostadcli < Formula
  desc "CLI for fetching apartments from bostad.stockholm.se"
  homepage "https://github.com/OWNER/bostadcli"
  version "0.1.0"

  on_macos do
    on_arm do
      url "https://github.com/OWNER/bostadcli/releases/download/v0.1.0/bostadcli_0.1.0_macos_arm64.tar.gz"
      sha256 "REPLACE_WITH_ARM64_SHA256"
    end

    on_intel do
      url "https://github.com/OWNER/bostadcli/releases/download/v0.1.0/bostadcli_0.1.0_macos_x64.tar.gz"
      sha256 "REPLACE_WITH_X64_SHA256"
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
