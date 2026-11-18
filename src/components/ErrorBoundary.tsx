import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onKaydiYukle: () => void;
  onYeniOyun: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ============================================================================
 * REACT HATA SINIRI (ERROR BOUNDARY)
 * Herhangi bir bileşen beklenmeyen bir hata fırlattığında beyaz ekran yerine
 * kullanıcının kaydı yükleyebileceği veya yeni oyun açabileceği kurtarma ekranı gösterir.
 * ============================================================================
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Yakalanan arayüz hatası:', error, errorInfo);
  }

  private handleKaydiYukle = (): void => {
    this.props.onKaydiYukle();
    this.setState({ hasError: false, error: null });
  };

  private handleYeniOyun = (): void => {
    this.props.onYeniOyun();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        data-testid="error-boundary-fallback"
        className="min-h-[100dvh] w-full bg-[#0B0E17] text-[#EAECEF] flex items-center justify-center p-4"
      >
        <section className="w-full max-w-md border border-[#3A4766] bg-[#121724] p-6 shadow-2xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 border border-[#D63838]/60 bg-[#221417] text-[#E34A4A] shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="font-display text-2xl font-extrabold tracking-wide text-[#EAECEF]">
                Bir şeyler ters gitti
              </h1>
              <p className="text-xs sm:text-sm text-[#A3ACBE] leading-relaxed">
                Oyunu çökerten beklenmedik bir hata oluştu. Son güvenli kaydı yükleyebilir ya da
                sıfırdan yeni bir oyun başlatabilirsin.
              </p>
            </div>
          </div>

          {this.state.error?.message && (
            <div className="border border-[#273147] bg-[#0B0E17] px-3 py-2 text-[11px] font-mono-tabular text-[#8B95AB] break-words">
              {this.state.error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              data-testid="error-boundary-load-save"
              onClick={this.handleKaydiYukle}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 bg-[#D63838] hover:bg-[#E34A4A] text-white font-display text-base font-bold tracking-wide px-4 py-2.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Kaydı Yükle</span>
            </button>
            <button
              type="button"
              data-testid="error-boundary-new-game"
              onClick={this.handleYeniOyun}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 border border-[#3A4766] bg-[#181F30] hover:bg-[#222B42] text-[#EAECEF] text-sm font-semibold px-4 py-2.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-[#8B95AB]" />
              <span>Yeni Oyun</span>
            </button>
          </div>
        </section>
      </main>
    );
  }
}
