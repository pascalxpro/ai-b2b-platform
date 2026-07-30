import React, { useState, useRef, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './TagInput.module.css';

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  disabled?: boolean;
  error?: string;
}

export function TagInput({
  label,
  tags,
  onChange,
  placeholder,
  suggestions = [],
  maxTags,
  disabled,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      if (maxTags && tags.length >= maxTags) return;
      onChange([...tags, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags.length - 1);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const isMaxReached = maxTags !== undefined && tags.length >= maxTags;

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <div className={styles.labelWrapper}>
          <label className={styles.label}>{label}</label>
          {maxTags && (
            <span className={`${styles.count} ${isMaxReached ? styles.countMax : ''}`}>
              {tags.length} / {maxTags}
            </span>
          )}
        </div>
      )}
      <div
        className={`
          ${styles.inputWrapper} 
          ${isFocused ? styles.focused : ''} 
          ${error ? styles.errorBorder : ''} 
          ${disabled ? styles.disabled : ''}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        <div className={styles.tagsContainer}>
          {tags.map((tag, i) => (
            <span key={i} className={styles.tag}>
              {tag}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(i);
                }}
                disabled={disabled}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (inputValue && filteredSuggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={disabled || isMaxReached}
          />
        </div>
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
      
      {showSuggestions && filteredSuggestions.length > 0 && !isMaxReached && (
        <ul className={styles.suggestions}>
          {filteredSuggestions.map((suggestion, i) => (
            <li
              key={i}
              className={styles.suggestionItem}
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddTag(suggestion);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
