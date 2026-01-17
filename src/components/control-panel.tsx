"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ASCIISettings, CHARACTER_PRESETS } from "@/lib/ascii-converter";
import { Plus, Trash2 } from "lucide-react";

interface ControlPanelProps {
  settings: ASCIISettings;
  onSettingsChange: (settings: ASCIISettings) => void;
}

export function ControlPanel({ settings, onSettingsChange }: ControlPanelProps) {
  const updateSetting = <K extends keyof ASCIISettings>(
    key: K,
    value: ASCIISettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const addGradientColor = () => {
    if (settings.gradientColors.length < 8) {
      updateSetting("gradientColors", [...settings.gradientColors, "#ffffff"]);
    }
  };

  const removeGradientColor = (index: number) => {
    if (settings.gradientColors.length > 2) {
      const newColors = settings.gradientColors.filter((_, i) => i !== index);
      updateSetting("gradientColors", newColors);
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    const newColors = [...settings.gradientColors];
    newColors[index] = color;
    updateSetting("gradientColors", newColors);
  };

  return (
    <div className="w-full h-full bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 space-y-4 scrollbar-thin overflow-y-auto">
      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="w-full bg-secondary grid grid-cols-4">
          <TabsTrigger value="characters">Chars</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Character Preset</Label>
            <Select
              value={
                Object.entries(CHARACTER_PRESETS).find(
                  ([, v]) => v === settings.characterSet
                )?.[0] || "custom"
              }
              onValueChange={(value) => {
                if (value !== "custom") {
                  updateSetting("characterSet", CHARACTER_PRESETS[value]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="blocks">Blocks</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="binary">Binary</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Custom Characters</Label>
            <Input
              value={settings.characterSet}
              onChange={(e) => updateSetting("characterSet", e.target.value)}
              placeholder="Enter characters (dark to light)"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Pixel Size</Label>
              <span className="text-xs text-primary">{settings.pixelSize}px</span>
            </div>
            <Slider
              value={[settings.pixelSize]}
              onValueChange={([v]) => updateSetting("pixelSize", v)}
              min={2}
              max={24}
              step={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Invert Characters</Label>
            <Switch
              checked={settings.invert}
              onCheckedChange={(v) => updateSetting("invert", v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Color Mode</Label>
            <Select
              value={settings.colorMode}
              onValueChange={(v) =>
                updateSetting("colorMode", v as ASCIISettings["colorMode"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original Colors</SelectItem>
                <SelectItem value="monochrome">Monochrome</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.colorMode === "monochrome" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.monochromeColor}
                  onChange={(e) => updateSetting("monochromeColor", e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={settings.monochromeColor}
                  onChange={(e) => updateSetting("monochromeColor", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {settings.colorMode === "gradient" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Gradient Colors</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addGradientColor}
                  disabled={settings.gradientColors.length >= 8}
                  className="h-7 px-2 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {settings.gradientColors.map((color, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => updateGradientColor(index, e.target.value)}
                      className="w-10 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      value={color}
                      onChange={(e) => updateGradientColor(index, e.target.value)}
                      className="flex-1 font-mono text-xs"
                    />
                    {settings.gradientColors.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeGradientColor(index)}
                        className="h-8 w-8 p-0 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div
                className="h-6 rounded-md w-full"
                style={{
                  background: `linear-gradient(to right, ${settings.gradientColors.join(", ")})`,
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
                disabled={settings.transparentBackground}
              />
              <Input
                value={settings.backgroundColor}
                onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                className="flex-1 font-mono text-sm"
                disabled={settings.transparentBackground}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Transparent Background</Label>
            <Switch
              checked={settings.transparentBackground}
              onCheckedChange={(v) => updateSetting("transparentBackground", v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Brightness</Label>
              <span className="text-xs text-primary">{Math.round(settings.brightness * 100)}%</span>
            </div>
            <Slider
              value={[settings.brightness]}
              onValueChange={([v]) => updateSetting("brightness", v)}
              min={0.2}
              max={2}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Contrast</Label>
              <span className="text-xs text-primary">{Math.round(settings.contrast * 100)}%</span>
            </div>
            <Slider
              value={[settings.contrast]}
              onValueChange={([v]) => updateSetting("contrast", v)}
              min={0.2}
              max={2}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Blend Mode</Label>
            <Select
              value={settings.blendMode}
              onValueChange={(v) =>
                updateSetting("blendMode", v as ASCIISettings["blendMode"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="multiply">Multiply</SelectItem>
                <SelectItem value="screen">Screen</SelectItem>
                <SelectItem value="overlay">Overlay</SelectItem>
                <SelectItem value="difference">Difference</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="output" className="space-y-4 mt-4">
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <p className="text-xs text-muted-foreground">
              Export your ASCII video in the same dimensions as the input file.
              Choose from GIF, MP4, or WebM formats.
            </p>
            <p className="text-xs text-primary">
              Transparent backgrounds are supported in GIF and WebM exports.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
