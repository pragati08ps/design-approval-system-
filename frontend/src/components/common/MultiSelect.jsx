import { useState, useRef, useEffect } from 'react';

const MultiSelect = ({ options, value, onChange, placeholder = "Select users..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState(value || []);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setSelectedIds(value || []);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionId) => {
        let newSelectedIds;
        if (selectedIds.includes(optionId)) {
            newSelectedIds = selectedIds.filter(id => id !== optionId);
        } else {
            newSelectedIds = [...selectedIds, optionId];
        }
        setSelectedIds(newSelectedIds);
        onChange(newSelectedIds);
    };

    const removeSelection = (optionId, e) => {
        e.stopPropagation();
        const newSelectedIds = selectedIds.filter(id => id !== optionId);
        setSelectedIds(newSelectedIds);
        onChange(newSelectedIds);
    };

    const getSelectedLabels = () => {
        return selectedIds
            .map(id => options.find(opt => opt.value === id)?.label)
            .filter(Boolean);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="input-field cursor-pointer min-h-[42px] flex flex-wrap gap-1 items-center"
            >
                {selectedIds.length === 0 ? (
                    <span className="text-gray-400">{placeholder}</span>
                ) : (
                    getSelectedLabels().map((label, index) => (
                        <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
                        >
                            {label}
                            <button
                                onClick={(e) => removeSelection(selectedIds[index], e)}
                                className="hover:text-blue-900 font-bold"
                                type="button"
                            >
                                ×
                            </button>
                        </span>
                    ))
                )}
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500 text-sm">No users available</div>
                    ) : (
                        options.map((option) => {
                            const isSelected = selectedIds.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${isSelected ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => { }}
                                        className="rounded text-blue-600"
                                    />
                                    <span className={isSelected ? 'font-semibold text-blue-900' : ''}>
                                        {option.label}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
