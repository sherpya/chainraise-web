'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from './ConnectButton';

import logo from '@/public/chainraise-logo.svg';

export default function Navbar() {
    const [isActive, setisActive] = useState(false);

    return (
        <nav className="navbar" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
                <Link className="navbar-item" href="/">
                    <Image
                        src={logo}
                        alt="Logo"
                        width="32"
                        height="32"
                    />
                </Link>

                <div className="my-auto">
                    <h1 className="has-text-weight-bold">ChainRaise</h1>
                </div>

                <a href="#"
                    onClick={() => { setisActive(!isActive); }}
                    role="button"
                    className={`navbar-burger burger ${isActive ? 'is-active' : ''}`}
                    aria-label="menu"
                    aria-expanded="false"
                    data-target="navbarAccount">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
            </div>
            <div id="navbarAccount" className={`navbar-menu ${isActive ? 'is-active' : ''}`}>
                <div className="navbar-end">
                    <div className="navbar-item">
                        <Link href="/create" className="navbar-item">
                            Create
                        </Link>
                    </div>
                    <div className="navbar-item">
                        <Link href="/claim" className="navbar-item">
                            Claim
                        </Link>
                    </div>
                    <div className="navbar-item">
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
