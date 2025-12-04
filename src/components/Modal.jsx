import React from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal show">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
