class Bostadstockholm < Formula
  desc "CLI for fetching apartments from bostad.stockholm.se"
  homepage "https://github.com/OWNER/bostadstockholm-cli"
  version "0.1.0"

  on_macos do
    on_arm do
      url "https://github.com/OWNER/bostadstockholm-cli/releases/download/v0.1.0/bostadstockholm_0.1.0_macos_arm64.tar.gz"
      sha256 "REPLACE_WITH_ARM64_SHA256"
    end
  end

  def install
    bin.install "bostadstockholm"
  end

  test do
    output = shell_output("#{bin}/bostadstockholm --help")
    assert_match "Usage:", output
  end
end
