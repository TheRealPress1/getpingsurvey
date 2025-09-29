import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

interface SkillsInterestsSelectorProps {
  type: 'skills' | 'interests';
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

const PREDEFINED_SKILLS = [
  'React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Node.js', 'CSS', 'HTML',
  'UI/UX Design', 'Project Management', 'Data Analysis', 'Machine Learning', 'AWS',
  'Docker', 'Git', 'SQL', 'MongoDB', 'GraphQL', 'Vue.js', 'Angular', 'Marketing',
  'Sales', 'Leadership', 'Communication', 'Problem Solving', 'Agile', 'Scrum'
];

const PREDEFINED_INTERESTS = [
  'Technology', 'Art', 'Music', 'Travel', 'Photography', 'Reading', 'Writing',
  'Sports', 'Gaming', 'Cooking', 'Fitness', 'Movies', 'Nature', 'Science',
  'History', 'Fashion', 'Entrepreneurship', 'Investing', 'Meditation', 'Yoga',
  'Volunteer Work', 'Languages', 'Culture', 'Architecture', 'Design', 'Innovation'
];

export const SkillsInterestsSelector: React.FC<SkillsInterestsSelectorProps> = ({
  type,
  selectedItems,
  onSelectionChange
}) => {
  const [customInput, setCustomInput] = useState('');
  const predefinedItems = type === 'skills' ? PREDEFINED_SKILLS : PREDEFINED_INTERESTS;

  const handleItemToggle = (item: string) => {
    const isSelected = selectedItems.includes(item);
    if (isSelected) {
      onSelectionChange(selectedItems.filter(selected => selected !== item));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  const handleCustomAdd = () => {
    const trimmedInput = customInput.trim();
    if (trimmedInput && !selectedItems.includes(trimmedInput)) {
      onSelectionChange([...selectedItems, trimmedInput]);
      setCustomInput('');
    }
  };

  const handleCustomInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomAdd();
    }
  };

  const removeItem = (item: string) => {
    onSelectionChange(selectedItems.filter(selected => selected !== item));
  };

  return (
    <div className="space-y-4">
      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Selected {type}:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <Badge 
                key={item} 
                variant="default"
                className="pr-1 gap-1 hover:bg-primary/80 transition-colors"
              >
                {item}
                <button
                  onClick={() => removeItem(item)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Predefined Options */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Popular {type}:
        </p>
        <div className="flex flex-wrap gap-2">
          {predefinedItems.map((item) => {
            const isSelected = selectedItems.includes(item);
            return (
              <Badge
                key={item}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10 hover:border-primary/50'
                }`}
                onClick={() => handleItemToggle(item)}
              >
                {item}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Custom Input */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Add custom {type.slice(0, -1)}:
        </p>
        <div className="flex gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={handleCustomInputKeyPress}
            placeholder={`Add your own ${type.slice(0, -1)}...`}
            className="flex-1"
          />
          <Button
            onClick={handleCustomAdd}
            disabled={!customInput.trim() || selectedItems.includes(customInput.trim())}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};