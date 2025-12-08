import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowRight, Shield, Zap, Target, Move } from "lucide-react";

interface TeamTacticalVisualProps {
  tacticalShape?: string | null;
  pressingStyle?: string | null;
  buildUpPlay?: string | null;
  defensiveApproach?: string | null;
  attackingPatterns?: string | null;
  defensivePatterns?: string | null;
  transitionPlay?: string | null;
}

const TeamTacticalVisual = ({
  tacticalShape,
  pressingStyle,
  buildUpPlay,
  defensiveApproach,
  attackingPatterns,
  defensivePatterns,
  transitionPlay,
}: TeamTacticalVisualProps) => {
  const hasData = tacticalShape || pressingStyle || buildUpPlay || defensiveApproach || 
                  attackingPatterns || defensivePatterns || transitionPlay;

  if (!hasData) return null;

  const getPressingIntensity = () => {
    if (!pressingStyle) return null;
    const lower = pressingStyle.toLowerCase();
    if (lower.includes('high') || lower.includes('gegenpressing') || lower.includes('intense')) return 'high';
    if (lower.includes('mid') || lower.includes('medium')) return 'medium';
    if (lower.includes('low') || lower.includes('deep')) return 'low';
    return null;
  };

  const pressingIntensity = getPressingIntensity();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Tactical Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Pressing Intensity Visual */}
        {pressingIntensity && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Pressing Line</p>
            <div className="relative h-24 bg-gradient-to-b from-green-600/20 via-green-500/10 to-green-400/5 rounded-lg border overflow-hidden">
              {/* Pitch lines */}
              <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-muted-foreground/30" />
              <div className="absolute top-2/3 left-0 right-0 border-t border-dashed border-muted-foreground/30" />
              
              {/* Pressing line indicator */}
              <div 
                className={`absolute left-0 right-0 h-8 flex items-center justify-center transition-all
                  ${pressingIntensity === 'high' ? 'top-2 bg-red-500/30' : ''}
                  ${pressingIntensity === 'medium' ? 'top-8 bg-yellow-500/30' : ''}
                  ${pressingIntensity === 'low' ? 'top-16 bg-blue-500/30' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {pressingIntensity === 'high' && 'High Press'}
                    {pressingIntensity === 'medium' && 'Mid Block'}
                    {pressingIntensity === 'low' && 'Low Block'}
                  </span>
                  <ArrowUp className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tactical Elements Grid */}
        <div className="grid grid-cols-2 gap-3">
          {tacticalShape && (
            <div className="p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Shape</p>
              </div>
              <p className="text-sm font-medium">{tacticalShape}</p>
            </div>
          )}
          
          {pressingStyle && (
            <div className="p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Pressing</p>
              </div>
              <p className="text-sm font-medium">{pressingStyle}</p>
            </div>
          )}

          {buildUpPlay && (
            <div className="p-2 bg-muted/30 rounded-lg col-span-2">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUp className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Build-up</p>
              </div>
              <p className="text-sm">{buildUpPlay}</p>
            </div>
          )}

          {defensiveApproach && (
            <div className="p-2 bg-muted/30 rounded-lg col-span-2">
              <div className="flex items-center gap-1 mb-1">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Defensive Approach</p>
              </div>
              <p className="text-sm">{defensiveApproach}</p>
            </div>
          )}
        </div>

        {/* Patterns Section */}
        {(attackingPatterns || defensivePatterns || transitionPlay) && (
          <div className="mt-4 pt-3 border-t space-y-3">
            {attackingPatterns && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <ArrowUp className="h-3 w-3 text-green-500" />
                  <p className="text-xs font-medium text-green-600">Attacking Patterns</p>
                </div>
                <p className="text-sm text-muted-foreground">{attackingPatterns}</p>
              </div>
            )}
            
            {defensivePatterns && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <p className="text-xs font-medium text-blue-600">Defensive Patterns</p>
                </div>
                <p className="text-sm text-muted-foreground">{defensivePatterns}</p>
              </div>
            )}
            
            {transitionPlay && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Move className="h-3 w-3 text-orange-500" />
                  <p className="text-xs font-medium text-orange-600">Transitions</p>
                </div>
                <p className="text-sm text-muted-foreground">{transitionPlay}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamTacticalVisual;
