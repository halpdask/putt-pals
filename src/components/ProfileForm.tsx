
import { useState } from "react";
import { GolferProfile, RoundType } from "../types/golfer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider"; 
import { useToast } from "@/components/ui/use-toast";

interface ProfileFormProps {
  profile: GolferProfile;
  onSave: (profile: GolferProfile) => void;
}

const roundTypes: { value: RoundType; label: string }[] = [
  { value: "Sällskapsrunda", label: "Sällskapsrunda" },
  { value: "Träningsrunda", label: "Träningsrunda" },
  { value: "Matchspel", label: "Matchspel" },
  { value: "Foursome", label: "Foursome" },
  { value: "Scramble", label: "Scramble" },
];

const availabilityOptions = [
  { value: "Vardagar", label: "Vardagar" },
  { value: "Helger", label: "Helger" },
  { value: "Morgnar", label: "Morgnar" },
  { value: "Kvällar", label: "Kvällar" },
];

const ProfileForm = ({ profile, onSave }: ProfileFormProps) => {
  const [formData, setFormData] = useState<GolferProfile>(profile);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseFloat(value) || 0 });
  };

  const handleRoundTypeChange = (type: RoundType, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        roundTypes: [...formData.roundTypes, type],
      });
    } else {
      setFormData({
        ...formData,
        roundTypes: formData.roundTypes.filter((t) => t !== type),
      });
    }
  };

  const handleAvailabilityChange = (time: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        availability: [...formData.availability, time],
      });
    } else {
      setFormData({
        ...formData,
        availability: formData.availability.filter((t) => t !== time),
      });
    }
  };

  const handleGenderChange = (value: "Man" | "Kvinna" | "Annat") => {
    setFormData({ ...formData, gender: value });
  };
  
  const handleSearchRadiusChange = (value: number[]) => {
    setFormData({ ...formData, search_radius_km: value[0] });
  };
  
  const handleHandicapDifferenceChange = (value: number[]) => {
    setFormData({ ...formData, max_handicap_difference: value[0] });
  };
  
  const handlePreferredAgeRangeChange = (min: number, max: number) => {
    setFormData({ 
      ...formData, 
      min_age_preference: min,
      max_age_preference: max
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast({
      title: "Profil sparad",
      description: "Dina profiländringar har sparats",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <div className="space-y-2">
        <Label htmlFor="name">Namn</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Ålder</Label>
        <Input
          id="age"
          name="age"
          type="number"
          value={formData.age}
          onChange={handleNumberChange}
          required
          min="18"
          max="100"
        />
      </div>

      <div className="space-y-2">
        <Label>Kön</Label>
        <RadioGroup 
          value={formData.gender} 
          onValueChange={(value) => handleGenderChange(value as "Man" | "Kvinna" | "Annat")}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Man" id="man" />
            <Label htmlFor="man">Man</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Kvinna" id="kvinna" />
            <Label htmlFor="kvinna">Kvinna</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Annat" id="annat" />
            <Label htmlFor="annat">Annat</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="handicap">Handicap</Label>
        <Input
          id="handicap"
          name="handicap"
          type="number"
          value={formData.handicap}
          onChange={handleNumberChange}
          required
          step="0.1"
          min="0"
          max="54"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="homeCourse">Hemmabana</Label>
        <Input
          id="homeCourse"
          name="homeCourse"
          value={formData.homeCourse}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Stad</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Om mig</Label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <Label>Vilka rundor söker du?</Label>
        <div className="grid grid-cols-2 gap-2">
          {roundTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`roundType-${type.value}`}
                checked={formData.roundTypes.includes(type.value)}
                onCheckedChange={(checked) => 
                  handleRoundTypeChange(type.value, checked as boolean)
                }
              />
              <Label htmlFor={`roundType-${type.value}`}>{type.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>När kan du spela?</Label>
        <div className="grid grid-cols-2 gap-2">
          {availabilityOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`availability-${option.value}`}
                checked={formData.availability.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleAvailabilityChange(option.value, checked as boolean)
                }
              />
              <Label htmlFor={`availability-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="search_radius_km">Sökradie (km)</Label>
        <Slider
          id="search_radius_km"
          defaultValue={[formData.search_radius_km]}
          min={5}
          max={200}
          step={5}
          onValueChange={handleSearchRadiusChange}
        />
        <div className="flex justify-between mt-1 text-sm text-gray-600">
          <span>5 km</span>
          <span>{formData.search_radius_km} km</span>
          <span>200 km</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_handicap_difference">Max handicap-skillnad</Label>
        <Slider
          id="max_handicap_difference"
          defaultValue={[formData.max_handicap_difference]}
          min={1}
          max={54}
          step={1}
          onValueChange={handleHandicapDifferenceChange}
        />
        <div className="flex justify-between mt-1 text-sm text-gray-600">
          <span>±1</span>
          <span>±{formData.max_handicap_difference}</span>
          <span>±54</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Åldersintervall</Label>
        <div className="flex items-center space-x-2">
          <Input 
            type="number" 
            min="18" 
            max="100"
            value={formData.min_age_preference}
            onChange={(e) => handlePreferredAgeRangeChange(
              parseInt(e.target.value) || 18,
              formData.max_age_preference
            )}
            className="w-20"
          />
          <span>till</span>
          <Input 
            type="number" 
            min="18" 
            max="100"
            value={formData.max_age_preference}
            onChange={(e) => handlePreferredAgeRangeChange(
              formData.min_age_preference,
              parseInt(e.target.value) || 100
            )}
            className="w-20"
          />
          <span>år</span>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-golf-green-dark hover:bg-golf-green-light"
      >
        Spara Profil
      </Button>
    </form>
  );
};

export default ProfileForm;
