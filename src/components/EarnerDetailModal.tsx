import React from 'react';
import {
  X,
  Award,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  BookMarked,
  Code,
  Sparkles,
  School,
  Briefcase,
  Star
} from 'lucide-react';
import { EarnerProfile } from '../types';
import { CAT_CODING, CAT_EDU, CAT_NOTEBOOK, CATEGORY_METADATA } from '../lib/constants';
import { triggerCelebration } from '../lib/api';

interface EarnerDetailModalProps {
  profile: EarnerProfile | null;
  celebrationsCount?: number;
  onClose: () => void;
  onCelebrate?: (e: React.MouseEvent) => void;
}

export const EarnerDetailModal: React.FC<EarnerDetailModalProps> = ({
  profile,
  celebrationsCount = 0,
  onClose,
  onCelebrate
}) => {
  if (!profile) return null;

  const uniqueCategories = new Set(profile.badges.map((b) => b.badge));
  const isTripleCrown = uniqueCategories.size >= 3;

  const getBadgeIcon = (cat: string) => {
    if (cat === CAT_EDU) return GraduationCap;
    if (cat === CAT_NOTEBOOK) return BookMarked;
    return Code;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 p-1.5 rounded-full transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white text-blue-600 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
              {profile.firstName?.[0] || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">{profile.fullName}</h3>
                {isTripleCrown && (
                  <span
                    className="bg-yellow-400 text-yellow-950 font-black text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs"
                    title="Earned all 3 Gemini credentials!"
                  >
                    <Star className="w-3 h-3 fill-yellow-950" />
                    Triple Crown
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-100 font-medium mt-1">
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5" />
                  {profile.department}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#4285F4]" />
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Earned Credentials ({profile.badges.length})
              </h4>
            </div>

            <button
              onClick={(e) => {
                if (onCelebrate) {
                  onCelebrate(e);
                } else {
                  triggerCelebration();
                }
              }}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title={`Send a cheer to ${profile.fullName}!`}
            >
              <span className="text-sm">🎉</span>
              <span>Celebrate {profile.firstName}</span>
              <span className="bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-black font-tabular text-[11px]">
                {celebrationsCount}
              </span>
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {profile.badges.map((b, idx) => {
              const Icon = getBadgeIcon(b.badge);
              return (
                <div
                  key={`${b.rawBadge}-${idx}`}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1a73e8] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-extrabold text-gray-900 leading-tight">
                        {b.badge}
                      </h5>
                      {b.rawBadge !== b.badge && (
                        <p className="text-[11px] text-gray-500 font-medium">
                          Submitted as: <span className="italic">{b.rawBadge}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        Earned: {b.timestamp}
                      </p>
                    </div>
                  </div>

                  {b.credentialUrl && b.credentialUrl !== '#' && (
                    <a
                      href={b.credentialUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shrink-0 transition"
                      title="Open Google Accredible certificate"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Wallet</span>
                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* District Recognition Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              SCUC ISD Instructional Technology Program
            </span>
            <button
              onClick={onClose}
              className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
